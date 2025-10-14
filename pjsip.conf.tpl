; PJSIP configuration for standalone Asterisk + Twilio SIP trunk + Zoiper softphones

[global]
type=global
user_agent=Asterisk-Twilio-Docker

[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0
external_signaling_address=${ASTERISK_PUBLIC_IP}
external_media_address=${ASTERISK_PUBLIC_IP}
allow_reload=yes

; ==================== Twilio SIP trunk ====================
; Twilio sends from the IP(s) listed below (IP ACL) and we place outbound calls
; to the SIP domain configured on the trunk. Credentials are optional but enabled here.

[twilio_trunk]
type=aor
contact=sip:${TWILIO_SIP_DOMAIN}:5060
qualify_frequency=60

[twilio_trunk]
type=endpoint
transport=transport-udp
context=from-twilio
disallow=all
allow=ulaw,alaw
aors=twilio_trunk
outbound_auth=twilio_auth
from_domain=${TWILIO_SIP_DOMAIN}
from_user=${TWILIO_ORIGINATING_NUMBER}
rewrite_contact=yes
force_rport=yes
rtp_symmetric=yes
direct_media=no
dtmf_mode=rfc4733
t38_udptl=no

[twilio_trunk]
type=identify
endpoint=twilio_trunk
match=${TWILIO_IPS}

[twilio_auth]
type=auth
auth_type=userpass
username=${TWILIO_USERNAME}
password=${TWILIO_PASSWORD}

; ==================== Softphone extensions ====================
; Extension 100 (Zoiper)
[100]
type=aor
max_contacts=3
remove_existing=yes

[100]
type=auth
auth_type=userpass
username=${EXT_100_USERNAME}
password=${EXT_100_PASSWORD}

[100]
type=endpoint
transport=transport-udp
context=internal
disallow=all
allow=ulaw,alaw
auth=100
aors=100
callerid=${EXT_100_CALLERID}
force_rport=yes
rtp_symmetric=yes
rewrite_contact=yes
dtmf_mode=rfc4733

; Example template for a second softphone. Uncomment and set EXT_101_* env vars to enable.
;[101]
;type=aor
;max_contacts=3
;remove_existing=yes
;
;[101]
;type=auth
;auth_type=userpass
;username=${EXT_101_USERNAME}
;password=${EXT_101_PASSWORD}
;
;[101]
;type=endpoint
;transport=transport-udp
;context=internal
;disallow=all
;allow=ulaw,alaw
;auth=101
;aors=101
;callerid=${EXT_101_CALLERID}
;force_rport=yes
;rtp_symmetric=yes
;rewrite_contact=yes
;dtmf_mode=rfc4733

