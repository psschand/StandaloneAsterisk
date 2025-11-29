# Voicemail System - Complete User Guide

## 📞 Overview

Your call center has a fully functional voicemail system integrated with Asterisk. This guide explains how to use all voicemail features, including leaving messages, checking messages, and using the interactive voice menu.

---

## 🎯 Quick Reference

| Action | Dial Code | Description |
|--------|-----------|-------------|
| **Check Your Voicemail** | `*97` | Access your own mailbox |
| **Check Any Mailbox** | `*98` | Access any mailbox (requires PIN) |
| **Leave a Message** | Call extension and wait | If 
agent doesn't answer, voicemail picks up |

---

## 📬 Configured Mailboxes

### Extension 1000
- **Mailbox Number**: 1000
- **PIN**: 1234
- **Owner**: Agent 1000
- **Email**: agent1000@example.com
- **Email Notifications**: ✅ Enabled (recordings attached)

### Extension 1001
- **Mailbox Number**: 1001
- **PIN**: 1234
- **Owner**: Agent 1001
- **Email**: agent1001@example.com
- **Email Notifications**: ✅ Enabled (recordings attached)

---

## 📞 How to Leave a Voicemail

### For Callers

1. **Dial the extension** (e.g., 1000 or 1001)
2. **Wait 20 seconds** - The phone will ring
3. **Voicemail greeting plays**: 
   - If unavailable: "The person at extension 1000 is unavailable. Please leave a message after the tone."
   - If busy: "The person at extension 1000 is busy. Please leave a message after the tone."
4. **Wait for the beep**
5. **Record your message** (maximum 180 seconds / 3 minutes)
6. **Hang up** when finished

### What Happens Next

- Message is saved in the mailbox
- Email notification sent to the agent with:
  - Subject: "New voicemail in mailbox 1000"
  - Message details (duration, caller ID)
  - Recording attached as audio file (WAV format)

---

## 🔊 How to Check Voicemail

### Method 1: Dial *97 (Your Own Mailbox)

1. **Pick up any phone** on the system
2. **Dial** `*97`
3. **Enter your mailbox number** when prompted (e.g., 1000)
4. **Enter your PIN** when prompted (default: 1234)
5. **Listen to the main menu**

### Method 2: Dial *98 (Any Mailbox)

1. **Pick up any phone**
2. **Dial** `*98`
3. **Enter the mailbox number** you want to check
4. **Enter the PIN** for that mailbox
5. **Listen to the main menu**

---

## 🎛️ Voicemail Menu System

### Main Menu

When you first access your voicemail, you'll hear:

```
"You have [X] new messages and [Y] saved messages."
```

Then the main menu plays with these options:

| Key | Action | Description |
|-----|--------|-------------|
| **1** | **Listen to Messages** | Play new and saved messages |
| **2** | **Change Folders** | Switch between New, Old, Work, Family, Friends |
| **3** | **Advanced Options** | Access advanced features |
| **0** | **Mailbox Options** | Change greetings, PIN, name |
| **\*** | **Help** | Hear the menu options again |
| **#** | **Exit** | Exit voicemail system |

---

### Listening to Messages (Press 1)

When playing a message, you have these options:

| Key | Action | What It Does |
|-----|--------|--------------|
| **1** | **Replay** | Replay the current message from the beginning |
| **2** | **Play Next** | Skip to the next message |
| **3** | **Advanced Options** | See Advanced Message Options below |
| **4** | **Previous Message** | Go back to the previous message |
| **5** | **Repeat Message** | Replay the current message |
| **6** | **Next Folder** | Move to the next folder (New → Old → Work → Family → Friends) |
| **7** | **Delete Message** | Delete the current message |
| **8** | **Forward Message** | Forward to another mailbox |
| **9** | **Save Message** | Save to Old Messages folder |
| **0** | **Mailbox Options** | Change settings |
| **\*** | **Help** | Hear message options again |
| **#** | **Exit** | Exit voicemail |

---

### Advanced Message Options (Press 3 while listening)

| Key | Action | Description |
|-----|--------|-------------|
| **1** | **Reply** | Call back the person who left the message |
| **2** | **Call Back** | Same as Reply |
| **3** | **Envelope** | Hear message details (caller ID, timestamp) |
| **4** | **Outgoing Call** | Make an outgoing call |
| **5** | **Leave Message** | Leave a message in another mailbox |

---

### Mailbox Options (Press 0 from main menu)

| Key | Action | Description |
|-----|--------|-------------|
| **1** | **Record Unavailable Greeting** | Record "I'm unavailable" greeting |
| **2** | **Record Busy Greeting** | Record "I'm busy" greeting |
| **3** | **Record Your Name** | Record your name for the system |
| **4** | **Change PIN** | Change your mailbox PIN |
| **5** | **Return to Main Menu** | Go back to main menu |
| **\*** | **Return to Main Menu** | Go back to main menu |

---

## 🎙️ Recording Custom Greetings

### Unavailable Greeting (When you don't answer)

1. Access voicemail (`*97`)
2. Press `0` for Mailbox Options
3. Press `1` to record unavailable greeting
4. **Record your message** after the beep (e.g., "Hi, this is John. I'm away from my desk...")
5. Press `#` when finished
6. **Review options**:
   - Press `1` to accept the recording
   - Press `2` to listen to it
   - Press `3` to re-record

### Busy Greeting (When you're on another call)

1. Access voicemail (`*97`)
2. Press `0` for Mailbox Options
3. Press `2` to record busy greeting
4. **Record your message** after the beep (e.g., "Sorry, I'm on another call...")
5. Press `#` when finished
6. Same review options as above

---

## 🔐 Changing Your PIN

### Important: Change the Default PIN!

The default PIN `1234` should be changed for security.

**Steps to Change PIN**:

1. Dial `*97` and log in
2. Press `0` for Mailbox Options
3. Press `4` to change PIN
4. Enter your **new PIN** (at least 4 digits)
5. Press `#` to confirm
6. **Re-enter new PIN** to verify
7. Press `#` to confirm again

**PIN Requirements**:
- Minimum 4 digits
- Maximum 10 digits
- Numbers only (0-9)
- Avoid obvious PINs like 1111, 1234, 0000

---

## 📧 Email Notifications

### How Email Notifications Work

When someone leaves you a voicemail:

1. **Email is sent immediately** to your configured address
2. **Subject Line**: `New voicemail in mailbox 1000`
3. **Email Body Contains**:
   ```
   There is a new voicemail in mailbox 1000.
   
   Duration: 00:45
   Caller ID: John Doe <+15551234567>
   ```
4. **Attachment**: Recording in WAV format (can be played in any media player)

### Email Configuration

To change your email address, update `voicemail.conf`:

```conf
[default]
1000 => 1234,Agent Name,your.email@company.com,,attach=yes
```

---

## 📁 Message Folders

Voicemail organizes messages into folders:

### Default Folders

| Folder | Purpose | Auto-Delete |
|--------|---------|-------------|
| **INBOX (New)** | New unheard messages | No |
| **Old** | Saved messages you've listened to | After 14 days |
| **Work** | Messages you've moved to Work | No |
| **Family** | Messages you've moved to Family | No |
| **Friends** | Messages you've moved to Friends | No |

### Moving Messages Between Folders

1. While listening to a message
2. Press `3` for Advanced Options
3. Press folder number to move:
   - `1` = INBOX
   - `2` = Old
   - `3` = Work
   - `4` = Family
   - `5` = Friends

---

## ⏱️ Voicemail Limits

| Setting | Value | Description |
|---------|-------|-------------|
| **Max Messages** | 100 | Maximum messages per mailbox |
| **Max Duration** | 180 seconds | Maximum message length (3 minutes) |
| **Max Greeting** | 60 seconds | Maximum greeting length |
| **Storage Format** | WAV49, GSM, WAV | Audio formats saved |
| **Message Expiry** | 14 days | Old messages auto-deleted after 14 days |

---

## 🔧 Troubleshooting

### "Invalid Password" Error

**Problem**: You hear "Invalid password" when entering PIN.

**Solutions**:
- Verify you're entering the correct PIN (default: 1234)
- Make sure you're entering the mailbox number correctly
- Check if someone changed your PIN
- Contact admin to reset PIN

### No Email Notifications

**Problem**: Not receiving voicemail emails.

**Solutions**:
1. Check spam/junk folder
2. Verify email address in `voicemail.conf`
3. Ensure `attach=yes` is set in configuration
4. Test with `*97` - message should still be in mailbox

### Can't Record Greeting

**Problem**: Recording cuts off or doesn't save.

**Solutions**:
- Speak clearly after the beep
- Press `#` when done recording
- Don't exceed 60 seconds
- Check for background noise

### "Mailbox Unavailable" Message

**Problem**: Voicemail says mailbox doesn't exist.

**Solutions**:
- Verify mailbox number (1000 or 1001)
- Check if mailbox is configured in `voicemail.conf`
- Contact system administrator

---

## 🎯 Quick Tips & Best Practices

### For Agents

✅ **DO**:
- Change your PIN from default (1234)
- Record a professional greeting
- Check voicemail at least twice daily
- Delete old messages regularly
- Save important messages to Work/Family folders

❌ **DON'T**:
- Share your PIN with others
- Let mailbox fill up (100 message limit)
- Leave default greeting active
- Forget to return urgent calls

### For Callers

✅ **DO**:
- Speak clearly and slowly
- Leave your name and phone number
- State the reason for your call
- Mention best time to call back
- Keep message under 2 minutes

❌ **DON'T**:
- Ramble or include unnecessary details
- Speak too fast
- Forget to leave callback number
- Leave extremely long messages

---

## 📋 Common Scenarios

### Scenario 1: Checking Messages During Lunch Break

```
1. Dial *97
2. Enter mailbox: 1000
3. Enter PIN: 1234
4. Press 1 to listen to messages
5. For each message:
   - Press 7 to delete
   - Press 9 to save
   - Press 8 to forward
6. Press # to exit
```

### Scenario 2: Recording Professional Greeting

```
1. Dial *97 and login
2. Press 0 for Mailbox Options
3. Press 1 for Unavailable Greeting
4. After beep, say:
   "Hi, you've reached John Smith in Sales.
    I'm unable to take your call right now.
    Please leave your name, number, and reason for calling,
    and I'll get back to you within 24 hours. Thank you!"
5. Press # to finish
6. Press 1 to accept
```

### Scenario 3: Forwarding Urgent Message to Manager

```
1. Listen to the message
2. Press 8 to forward
3. Enter manager's mailbox number (e.g., 1001)
4. Record introduction:
   "This is John, forwarding an urgent customer call..."
5. Press # to send
```

---

## 🔄 Integration with Contact Management

### Auto-Linking Messages to Contacts

The voicemail system integrates with your Contact Management:

1. **Incoming call** leaves voicemail
2. System captures **Caller ID** (phone number)
3. **Searches contacts** database for matching phone
4. If match found:
   - Links voicemail to contact record
   - Shows in contact's call history
   - Displays contact name in email notification

### Viewing Voicemails in Contact Details

1. Go to **Contacts** menu
2. Click **eye icon** on any contact
3. Scroll to **Call History** section
4. Voicemails shown with 📧 icon
5. Click to play recording (if stored)

---

## 📞 Advanced Features

### Call Screening (Future Enhancement)

```
Caller leaves message → You dial *97 while they're recording
→ Press 1 to pick up the call
→ Press 2 to continue screening
```

### Voicemail to Email (Active)

- Enabled by default
- Recordings sent as WAV attachments
- Play directly from email
- Forward to colleagues easily

### Multiple Greetings (Available)

- **Unavailable**: When you don't answer
- **Busy**: When you're on another call
- **Temporary**: For holidays/vacation (manual setup required)

---

## 🛠️ Administrator Commands

### Checking Voicemail Status

```bash
# List all voicemail users
asterisk -rx "voicemail show users"

# Reload voicemail configuration
asterisk -rx "module reload app_voicemail"

# Check specific mailbox
ls -la /var/spool/asterisk/voicemail/default/1000/
```

### Reset User PIN

Edit `voicemail.conf`:
```conf
[default]
1000 => 1234,Agent 1000,agent1000@example.com,,attach=yes
       ^^^^^
       Change this PIN
```

Then reload:
```bash
asterisk -rx "module reload app_voicemail"
```

---

## 📊 Statistics & Reporting

### Voicemail Metrics

Track these metrics for call center efficiency:

- **Average messages per day**
- **Response time to voicemails**
- **Percentage of calls going to voicemail**
- **Average message duration**
- **Abandoned voicemail percentage**

### Access Statistics

Use Asterisk CLI:
```bash
asterisk -rx "voicemail show zones"
asterisk -rx "voicemail show users for default"
```

---

## ✅ Configuration Summary

### Current Setup

```conf
[general]
format=wav49|gsm|wav          # Multiple audio formats
maxmsg=100                    # Max 100 messages per mailbox
maxsecs=180                   # Max 3-minute messages
emailsubject=New voicemail... # Email subject template
emailbody=There is a new...   # Email body template

[default]
1000 => 1234,Agent 1000,agent1000@example.com,,attach=yes
1001 => 1234,Agent 1001,agent1001@example.com,,attach=yes
```

### File Locations

| Item | Path |
|------|------|
| **Configuration** | `/etc/asterisk/voicemail.conf` |
| **Messages** | `/var/spool/asterisk/voicemail/default/1000/INBOX/` |
| **Greetings** | `/var/spool/asterisk/voicemail/default/1000/unavail.wav` |
| **Logs** | `/var/log/asterisk/messages` |

---

## 🎓 Training Checklist

For new agents, ensure they can:

- [ ] Access voicemail using *97
- [ ] Enter mailbox number and PIN correctly
- [ ] Listen to messages and navigate menu
- [ ] Delete unnecessary messages
- [ ] Save important messages
- [ ] Record professional greeting
- [ ] Change default PIN to personal PIN
- [ ] Forward messages to colleagues
- [ ] Check voicemail via email
- [ ] Return calls from voicemail notifications

---

## 📞 Support

### Need Help?

- **Technical Issues**: Contact system administrator
- **PIN Reset**: Email IT support with mailbox number
- **Feature Requests**: Submit ticket to development team
- **Training**: Review this guide or attend voicemail training session

---

## 🔗 Related Documentation

- **CONTACT_MANAGEMENT_COMPLETE.md** - Contact system integration
- **VOICEMAIL_AND_CONTACTS_COMPLETE.md** - Implementation details
- **CALL_TESTING_GUIDE.md** - Test call flows with voicemail

---

**Last Updated**: November 27, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
