Twilio SIP Trunk Notes

- Twilio supports two main authentication models for SIP trunks:
	- IP Access Control List (recommended): Twilio sends calls from a set of IP addresses. Configure `identify` sections in `pjsip.conf` matching Twilio IPs and no user credentials required.
	- Credential-based authentication: Twilio will authenticate using username/password. Configure `auth` sections in `pjsip.conf` and use those credentials in Twilio SIP trunk settings.

- Configure Twilio to send SIP INVITEs to your public IP (or proxy) and ensure UDP/TCP 5060 and UDP 10000-20000 are reachable.

- If NAT is involved, set the external address in `pjsip` transport or use RTP/ICE settings. This simple template uses plain UDP; for production consider TLS and SRTP.



North America Virginia
nlpbay.pstn.ashburn.twilio.com
North America Oregon
nlpbay.pstn.umatilla.twilio.com
Europe Dublin
nlpbay.pstn.dublin.twilio.com
Europe Frankfurt
nlpbay.pstn.frankfurt.twilio.com
South America Sao Paulo
nlpbay.pstn.sao-paulo.twilio.com
Asia Pacific Singapore
nlpbay.pstn.singapore.twilio.com
Asia Pacific Tokyo
nlpbay.pstn.tokyo.twilio.com
Asia Pacific Sydney
nlpbay.pstn.sydney.twilio.com


IP Access Control Lists
138.2.68.107

Credential Lists
user: Admin
password:Admin@123456

user: Admin
password:Admin@1234567

Origination URI	sip:138.2.68.107:5060

number 
+19863334949
(986) 333-4949



-----------------
error
 NOTICE[35]: res_pjsip/pjsip_distributor.c:688 log_failed_request: Request 'INVITE' from '<sip:hello@nlpbay.pstn.twilio.com>' failed for '54.172.60.1:5060' (callid: 1492d3fa6e04f8279a8889528e518750@0.0.0.0) - No matching endpoint found