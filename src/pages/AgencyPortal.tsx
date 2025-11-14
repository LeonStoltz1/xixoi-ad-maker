import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Users, DollarSign } from 'lucide-react';

export default function AgencyPortal() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyName, setAgencyName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');

  useEffect(() => {
    loadAgencyData();
  }, []);

  const loadAgencyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has agency plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (profile?.plan !== 'agency') {
        toast.error('Agency plan required');
        navigate('/dashboard');
        return;
      }

      // Load agency config
      const { data: configData } = await supabase
        .from('agency_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (configData) {
        setConfig(configData);
        setAgencyName(configData.agency_name);
        setCustomDomain(configData.custom_domain || '');
        setLogoUrl(configData.logo_url || '');
        setPrimaryColor(configData.primary_color || '#000000');
      }

      // Load clients
      const { data: clientsData } = await supabase
        .from('agency_clients')
        .select('*, profiles!client_user_id(email, full_name)')
        .eq('agency_user_id', user.id)
        .eq('is_active', true);

      setClients(clientsData || []);
    } catch (error: any) {
      console.error('Agency load error:', error);
      toast.error('Failed to load agency data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (config) {
        await supabase
          .from('agency_config')
          .update({
            agency_name: agencyName,
            custom_domain: customDomain,
            logo_url: logoUrl,
            primary_color: primaryColor
          })
          .eq('id', config.id);
      } else {
        await supabase
          .from('agency_config')
          .insert({
            user_id: user.id,
            agency_name: agencyName,
            custom_domain: customDomain,
            logo_url: logoUrl,
            primary_color: primaryColor
          });
      }

      toast.success('Agency config saved');
      loadAgencyData();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save config');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-lg md:text-xl">Loading agency portal...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">Agency White-Label Portal</h1>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Agency Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">Active</p>
              <p className="text-sm text-muted-foreground mt-1">$999/month plan</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold">{clients.length}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">White-Label Configuration</CardTitle>
            <CardDescription>Customize your agency branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agency-name">Agency Name</Label>
              <Input
                id="agency-name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Your Agency Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-domain">Custom Domain (optional)</Label>
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="ads.youragency.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://youragency.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Brand Color</Label>
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveConfig} className="w-full">
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-sm md:text-base text-muted-foreground">No clients yet</p>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border border-foreground/10 rounded-lg">
                    <div>
                      <p className="text-sm md:text-base font-medium">{client.client_name}</p>
                      <p className="text-xs text-muted-foreground">{client.profiles?.email}</p>
                    </div>
                    <p className="text-sm font-medium">{client.markup_percentage}% markup</p>
                  </div>
                ))}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}