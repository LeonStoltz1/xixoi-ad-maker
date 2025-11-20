-- Create function to send affiliate welcome email
CREATE OR REPLACE FUNCTION public.trigger_send_affiliate_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the send-affiliate-welcome edge function
  PERFORM
    net.http_post(
      url := (SELECT CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-affiliate-welcome')),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key'))
      ),
      body := jsonb_build_object('affiliateId', NEW.id::text)
    );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically send welcome email on new affiliate
CREATE TRIGGER on_affiliate_created
  AFTER INSERT ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_affiliate_welcome();