-- First update existing records
UPDATE cdrs SET recording_url = userfield WHERE userfield IS NOT NULL AND userfield != '' AND recording_url IS NULL;

DROP TRIGGER IF EXISTS cdrs_before_insert;

DELIMITER //
CREATE TRIGGER cdrs_before_insert BEFORE INSERT ON cdrs
FOR EACH ROW
BEGIN
    -- Populate our application columns from Asterisk's standard columns
    SET NEW.call_date = COALESCE(NEW.calldate, NEW.call_date, CURRENT_TIMESTAMP);
    SET NEW.caller_id = COALESCE(NEW.clid, NEW.caller_id);
    SET NEW.destination = COALESCE(NEW.dst, NEW.destination);
    SET NEW.destination_channel = COALESCE(NEW.dstchannel, NEW.destination_channel);
    SET NEW.billable_duration = COALESCE(NEW.billsec, NEW.billable_duration, 0);
    SET NEW.tenant_id = COALESCE(NEW.accountcode, NEW.tenant_id, 'demo-tenant');
    SET NEW.unique_id = COALESCE(NEW.uniqueid, NEW.unique_id);
    SET NEW.user_field = COALESCE(NEW.userfield, NEW.user_field);
    
    -- Auto-populate recording_url from userfield
    IF NEW.userfield IS NOT NULL AND NEW.userfield != '' THEN
        SET NEW.recording_url = NEW.userfield;
    END IF;
    
    -- Auto-detect call direction
    IF NEW.direction IS NULL THEN
        IF NEW.dcontext = 'from-twilio' OR NEW.channel LIKE '%twilio%' THEN
            SET NEW.direction = 'inbound';
        ELSEIF NEW.dcontext = 'outbound' THEN
            SET NEW.direction = 'outbound';
        ELSEIF NEW.dst REGEXP '^[0-9]{3,4}$' AND NEW.dst NOT REGEXP '^[+][0-9]{10,}' THEN
            SET NEW.direction = 'internal';
        END IF;
    END IF;
END//
DELIMITER ;
