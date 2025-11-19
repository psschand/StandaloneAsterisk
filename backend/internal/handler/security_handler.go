package handler

import (
	"bufio"
	"errors"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/pkg/response"
)

const (
	defaultFail2banJail = "asterisk"
	fail2banSocketPath  = "/var/run/fail2ban/fail2ban.sock"
	fail2banLogPath     = "/var/log/fail2ban.log"
)

// SecurityHandler handles security-related operations backed by fail2ban.
type SecurityHandler struct{}

// NewSecurityHandler creates a new security handler.
func NewSecurityHandler() *SecurityHandler {
	return &SecurityHandler{}
}

// BlockedIP represents a blocked IP address entry returned to the UI.
type BlockedIP struct {
	IP       string `json:"ip"`
	Reason   string `json:"reason,omitempty"`
	JailName string `json:"jail_name"`
}

// GetBlockedIPs returns the current list of banned IPs from fail2ban.
func (h *SecurityHandler) GetBlockedIPs(c *gin.Context) {
	jailName := c.DefaultQuery("jail", defaultFail2banJail)

	output, err := runFail2banCommand("status", jailName)
	if err != nil {
		log.Printf("[SecurityHandler] failed to get blocked IPs: %v", err)
		response.InternalError(c, err.Error())
		return
	}

	blockedIPs := parseBlockedIPs(string(output), jailName)
	response.Success(c, gin.H{
		"blocked_ips": blockedIPs,
		"total":       len(blockedIPs),
		"jail":        jailName,
	})
}

// BlockIP manually bans an IP address via fail2ban.
func (h *SecurityHandler) BlockIP(c *gin.Context) {
	var req struct {
		IP       string `json:"ip" binding:"required"`
		JailName string `json:"jail_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request payload")
		return
	}

	if req.JailName == "" {
		req.JailName = defaultFail2banJail
	}

	if req.IP == "" {
		response.BadRequest(c, "IP address is required")
		return
	}

	if _, err := runFail2banCommand("set", req.JailName, "banip", req.IP); err != nil {
		log.Printf("[SecurityHandler] failed to ban IP %s: %v", req.IP, err)
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "IP blocked successfully",
		"ip":      req.IP,
		"jail":    req.JailName,
	})
}

// UnblockIP removes an IP from the fail2ban jail.
func (h *SecurityHandler) UnblockIP(c *gin.Context) {
	ip := strings.TrimSpace(c.Param("ip"))
	if ip == "" {
		response.BadRequest(c, "IP address is required")
		return
	}

	jailName := c.DefaultQuery("jail", defaultFail2banJail)
	if _, err := runFail2banCommand("set", jailName, "unbanip", ip); err != nil {
		log.Printf("[SecurityHandler] failed to unban IP %s: %v", ip, err)
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "IP unblocked successfully",
		"ip":      ip,
		"jail":    jailName,
	})
}

// GetSecurityStats returns aggregated statistics for the requested fail2ban jail.
func (h *SecurityHandler) GetSecurityStats(c *gin.Context) {
	jailName := c.DefaultQuery("jail", defaultFail2banJail)

	output, err := runFail2banCommand("status", jailName)
	if err != nil {
		log.Printf("[SecurityHandler] failed to fetch security stats: %v", err)
		response.InternalError(c, err.Error())
		return
	}

	stats := parseSecurityStats(string(output), jailName)
	response.Success(c, stats)
}

// GetFirewallLogs reads recent events from the fail2ban log for the configured jail.
func (h *SecurityHandler) GetFirewallLogs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}

	logs, err := readFail2banLogs(limit)
	if err != nil {
		log.Printf("[SecurityHandler] failed to read fail2ban logs: %v", err)
		response.InternalError(c, "Failed to read firewall logs")
		return
	}

	response.Success(c, gin.H{
		"logs":  logs,
		"total": len(logs),
	})
}

// runFail2banCommand executes fail2ban-client against the host socket and returns the output.
func runFail2banCommand(args ...string) ([]byte, error) {
	if err := ensureFail2banSocket(); err != nil {
		return nil, err
	}

	cmdArgs := append([]string{"-s", fail2banSocketPath}, args...)
	cmd := exec.Command("fail2ban-client", cmdArgs...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		trimmed := strings.TrimSpace(string(output))
		if trimmed == "" {
			trimmed = err.Error()
		}
		return nil, errors.New(trimmed)
	}

	return output, nil
}

func ensureFail2banSocket() error {
	info, err := os.Stat(fail2banSocketPath)
	if err != nil {
		return errors.New("fail2ban socket not accessible")
	}
	if info.Mode()&os.ModeSocket == 0 {
		return errors.New("fail2ban socket path is invalid")
	}
	return nil
}

func parseBlockedIPs(output, jailName string) []BlockedIP {
	blocked := make([]BlockedIP, 0)
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if strings.Contains(line, "Banned IP list:") {
			parts := strings.Split(line, ":")
			if len(parts) > 1 {
				ips := strings.Fields(parts[1])
				for _, ip := range ips {
					ip = strings.TrimSpace(ip)
					if ip == "" {
						continue
					}
					blocked = append(blocked, BlockedIP{
						IP:       ip,
						Reason:   "Blocked by fail2ban",
						JailName: jailName,
					})
				}
			}
		}
	}

	return blocked
}

func parseSecurityStats(output, jailName string) map[string]interface{} {
	stats := map[string]interface{}{
		"jail_name": jailName,
	}

	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		switch {
		case strings.Contains(line, "Currently failed:"):
			stats["currently_failed"] = extractStatValue(line)
		case strings.Contains(line, "Total failed:"):
			stats["total_failed"] = extractStatValue(line)
		case strings.Contains(line, "Currently banned:"):
			stats["currently_banned"] = extractStatValue(line)
		case strings.Contains(line, "Total banned:"):
			stats["total_banned"] = extractStatValue(line)
		}
	}

	return stats
}

func extractStatValue(line string) string {
	parts := strings.Split(line, ":")
	if len(parts) < 2 {
		return "0"
	}
	return strings.TrimSpace(parts[len(parts)-1])
}

func readFail2banLogs(limit int) ([]map[string]string, error) {
	file, err := os.Open(fail2banLogPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lines := make([]string, 0)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}

	logs := make([]map[string]string, 0, limit)

	for i := len(lines) - 1; i >= 0 && len(logs) < limit; i-- {
		line := strings.TrimSpace(lines[i])
		if line == "" || !strings.Contains(line, "["+defaultFail2banJail+"]") {
			continue
		}

		timestamp := ""
		if len(line) >= 23 {
			tsRaw := strings.TrimSpace(line[:23])
			if parsed, err := time.Parse("2006-01-02 15:04:05,000", tsRaw); err == nil {
				timestamp = parsed.Format(time.RFC3339)
			} else {
				timestamp = tsRaw
			}
		}

		reason := ""
		sourceIP := ""
		fields := strings.Fields(line)
		for idx, field := range fields {
			if idx+1 >= len(fields) {
				continue
			}
			next := strings.Trim(fields[idx+1], "[]:,()")
			switch strings.ToLower(field) {
			case "ban":
				reason = "Ban"
				sourceIP = next
			case "found":
				if reason == "" {
					reason = "Found"
				}
				sourceIP = next
			case "unban":
				reason = "Unban"
				sourceIP = next
			}
			if sourceIP != "" {
				break
			}
		}

		logs = append(logs, map[string]string{
			"timestamp": timestamp,
			"message":   line,
			"reason":    reason,
			"source_ip": sourceIP,
		})
	}

	// restore chronological order
	for i, j := 0, len(logs)-1; i < j; i, j = i+1, j-1 {
		logs[i], logs[j] = logs[j], logs[i]
	}

	return logs, nil
}
