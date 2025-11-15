-- Add UPDATE policy for ad_variants so users can edit their own ad variants
CREATE POLICY "Users can update variants for own campaigns"
ON ad_variants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM campaigns
    WHERE campaigns.id = ad_variants.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can update variants for own campaigns" ON ad_variants IS 'Allows users to edit ad variants for campaigns they own';