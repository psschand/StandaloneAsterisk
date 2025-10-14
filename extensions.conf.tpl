[general]
static=yes
writeprotect=no
clearglobalvars=no

[default]
exten => s,1,NoOp(Default context)
 same => n,Hangup()

[from-twilio]
; Route the Twilio DID to extension 100 (Zoiper)
exten => +19863334949,1,NoOp(Inbound Twilio call for ${EXTEN})
 same => n,Goto(internal,100,1)

; Fallback: match 10-digit version of the DID
exten => 9863334949,1,NoOp(Inbound Twilio 10-digit match ${EXTEN})
 same => n,Goto(internal,100,1)

; Catch-all to avoid call loops
exten => _X.,1,NoOp(Unhandled Twilio DID ${EXTEN})
 same => n,Playback(silence/1&invalid)
 same => n,Hangup()

[outbound]
; Dial out via Twilio SIP trunk
; Use prefix 9 to dial external numbers: dial 9 + E.164 or national number
exten => _9.,1,NoOp(Outbound via Twilio: ${EXTEN})
 same => n,Set(NUM=${EXTEN:1})
 same => n,Set(CALLERID(num)=${TWILIO_ORIGINATING_NUMBER})
 same => n,Set(CALLERID(name)=CallCenter)
 same => n,NoOp(Dialing ${NUM} from ${CALLERID(num)})
 same => n,Dial(PJSIP/${NUM}@twilio_trunk,30)
 same => n,Hangup()

[internal]
; Internal softphone dialing
exten => 100,1,NoOp(Ringing extension 100)
 same => n,Dial(PJSIP/100,20)
 same => n,Hangup()

; Example: enable extension 101 if configured in pjsip.conf
exten => 101,1,NoOp(Ringing extension 101)
 same => n,Dial(PJSIP/101,20)
 same => n,Hangup()

include => outbound
