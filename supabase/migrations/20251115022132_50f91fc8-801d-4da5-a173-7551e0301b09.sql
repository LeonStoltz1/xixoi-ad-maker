-- Allow users to update campaign assets for their own campaigns
CREATE POLICY "Users can update assets for own campaigns"
ON campaign_assets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_assets.campaign_id
    AND campaigns.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_assets.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);