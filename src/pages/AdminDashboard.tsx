import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

interface WatermarkAd {
  id: string;
  user_email: string;
  campaign_name: string;
  platform: string;
  published_at: string;
  tampered: boolean;
  charged: boolean;
  revenue: number;
  image_url: string;
  fingerprint: string;
  user_id: string;
  campaign_id: string;
}

export default function AdminDashboard() {
  const [ads, setAds] = useState<WatermarkAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tampered' | 'charged'>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAds();
    }
  }, [filter, isAdmin]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      toast.error('Access denied: Admin only');
      navigate('/dashboard');
      return;
    }

    setIsAdmin(true);
  };

  const fetchAds = async () => {
    setLoading(true);
    let query = supabase
      .from('admin_watermark_report' as any)
      .select('*')
      .order('published_at', { ascending: false });

    if (filter === 'tampered') query = query.eq('tampered', true);
    if (filter === 'charged') query = query.eq('charged', true);

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load data');
      console.error(error);
    } else {
      setAds((data as any) || []);
    }
    setLoading(false);
  };

  const chargeUser = async (adId: string, userEmail: string) => {
    if (!confirm(`Charge $29 to ${userEmail} for watermark removal?`)) return;

    toast.loading('Processing charge...');
    const { error } = await supabase.functions.invoke('admin-charge-watermark', {
      body: { free_ad_id: adId }
    });

    if (error) {
      toast.error('Charge failed: ' + error.message);
    } else {
      toast.success('Successfully charged $29');
      fetchAds();
    }
  };

  const forgive = async (adId: string) => {
    if (!confirm('Forgive this violation? This will mark it as not tampered and not charged.')) return;

    const { error } = await supabase
      .from('free_ads' as any)
      .update({ tampered: false, charged: false })
      .eq('id', adId);

    if (error) {
      toast.error('Failed to forgive');
    } else {
      toast.success('Violation forgiven');
      fetchAds();
    }
  };

  const totalRevenue = ads.reduce((sum, ad) => sum + ad.revenue, 0);
  const tamperedCount = ads.filter(ad => ad.tampered).length;
  const chargedCount = ads.filter(ad => ad.charged).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Watermark Violations Dashboard</h1>
              <p className="text-muted-foreground">Monitor free ads, detect tampering, and enforce payments</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/affiliate-admin')}>
                Affiliate Management
              </Button>
              <Button variant="outline" onClick={() => navigate('/payouts')}>
                Payouts
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Free Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{ads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tampered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-destructive">{tamperedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Charged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-green-600">{chargedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Free Ad Publications</CardTitle>
                <CardDescription>Track and manage watermark violations</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  All ({ads.length})
                </Button>
                <Button
                  onClick={() => setFilter('tampered')}
                  variant={filter === 'tampered' ? 'default' : 'outline'}
                  size="sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Tampered
                </Button>
                <Button
                  onClick={() => setFilter('charged')}
                  variant={filter === 'charged' ? 'default' : 'outline'}
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Charged
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Campaign</th>
                    <th className="text-left p-3 font-medium">Platform</th>
                    <th className="text-left p-3 font-medium">Published</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        No free ads found
                      </td>
                    </tr>
                  ) : (
                    ads.map((ad) => (
                      <tr key={ad.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="text-sm">{ad.user_email}</div>
                          <div className="text-xs text-muted-foreground">{ad.fingerprint.slice(0, 16)}...</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{ad.campaign_name}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">
                            {ad.platform.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {ad.published_at ? format(new Date(ad.published_at), 'MMM d, h:mm a') : 'Not published'}
                        </td>
                        <td className="p-3">
                          {ad.tampered ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              TAMPERED
                            </Badge>
                          ) : ad.charged ? (
                            <Badge className="bg-green-600">
                              <DollarSign className="w-3 h-3 mr-1" />
                              $29 CHARGED
                            </Badge>
                          ) : (
                            <Badge variant="outline">Free</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {!ad.charged && (
                              <Button
                                onClick={() => chargeUser(ad.id, ad.user_email)}
                                size="sm"
                                variant="default"
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Charge $29
                              </Button>
                            )}
                            {ad.tampered && (
                              <Button
                                onClick={() => forgive(ad.id)}
                                size="sm"
                                variant="outline"
                              >
                                Forgive
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>Export functionality coming soon</p>
        </div>
      </div>
    </div>
  );
}
