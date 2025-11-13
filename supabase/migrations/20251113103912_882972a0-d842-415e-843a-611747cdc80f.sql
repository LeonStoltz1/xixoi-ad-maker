-- Make campaign-assets bucket public so images can display in ads
UPDATE storage.buckets 
SET public = true 
WHERE name = 'campaign-assets';