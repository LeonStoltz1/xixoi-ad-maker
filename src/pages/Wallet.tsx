import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Wallet, TrendingUp, TrendingDown, ArrowLeft, Plus } from 'lucide-react';
import { EmbeddedCheckout } from '@/components/EmbeddedCheckout';

export default function WalletPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadAmount, setReloadAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get or create wallet
      let { data: walletData } = await supabase
        .from('ad_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!walletData) {
        const { data: newWallet } = await supabase
          .from('ad_wallets')
          .insert({ user_id: user.id })
          .select()
          .single();
        walletData = newWallet;
      }

      setWallet(walletData);

      // Get transactions
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*, campaigns(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(txData || []);
    } catch (error: any) {
      console.error('Wallet load error:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    const amount = parseFloat(reloadAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter valid amount');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('wallet-reload', {
        body: { amount }
      });

      if (error) throw error;
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Reload error:', error);
      toast.error(error.message || 'Failed to reload wallet');
    }
  };

  const handleReloadSuccess = () => {
    toast.success('Wallet reloaded successfully!');
    setClientSecret('');
    setReloadAmount('');
    loadWallet();
  };

  if (clientSecret) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => setClientSecret('')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <EmbeddedCheckout
            clientSecret={clientSecret}
            amount={`$${reloadAmount}`}
            description="Wallet Reload"
            onSuccess={handleReloadSuccess}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-lg md:text-xl">Loading wallet...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold text-primary">
                ${parseFloat(wallet?.balance || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Total Deposited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold">
                ${parseFloat(wallet?.total_deposited || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold">
                ${parseFloat(wallet?.total_spent || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Reload Wallet</CardTitle>
            <CardDescription>Add funds to your ad spend wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Amount (USD)"
                value={reloadAmount}
                onChange={(e) => setReloadAmount(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleReload} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Reload
              </Button>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              No service fee for wallet reloads. $5 fee only applies to direct campaign funding.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-sm md:text-base text-muted-foreground">No transactions yet</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border border-foreground/10 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-medium">
                        {tx.type === 'deposit' ? 'Wallet Reload' : tx.type === 'spend' ? 'Campaign Spend' : tx.type}
                      </p>
                      {tx.campaigns?.name && (
                        <p className="text-xs md:text-sm text-muted-foreground">{tx.campaigns.name}</p>
                      )}
                      {tx.description && (
                        <p className="text-xs text-muted-foreground">{tx.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className={`text-lg md:text-xl font-bold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}