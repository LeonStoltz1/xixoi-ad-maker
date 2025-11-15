import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useRealtor } from '@/contexts/RealtorContext';
import { toast } from 'sonner';

const realtorSchema = z.object({
  isRealtor: z.boolean(),
  realtorName: z.string().optional(),
  brokerageName: z.string().optional(),
  licenseState: z.string().optional(),
});

type RealtorFormValues = z.infer<typeof realtorSchema>;

export function RealtorIdentification() {
  const navigate = useNavigate();
  const { updateRealtorProfile } = useRealtor();
  const [isRealtor, setIsRealtor] = useState(false);

  const form = useForm<RealtorFormValues>({
    resolver: zodResolver(realtorSchema),
    defaultValues: {
      isRealtor: false,
      realtorName: '',
      brokerageName: '',
      licenseState: '',
    },
  });

  async function onSubmit(data: RealtorFormValues) {
    try {
      await updateRealtorProfile({
        isRealtor: data.isRealtor,
        realtorName: data.realtorName || null,
        brokerageName: data.brokerageName || null,
        licenseState: data.licenseState || null,
      });
      
      toast.success(data.isRealtor ? 'Realtor profile saved!' : 'Profile saved!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save profile');
    }
  }

  async function handleSkip() {
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Welcome to xiXoi!</CardTitle>
          <CardDescription>
            Help us personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="isRealtor"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Are you a licensed realtor?
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Unlock specialized features for real estate advertising
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsRealtor(checked);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isRealtor && (
                <>
                  <FormField
                    control={form.control}
                    name="realtorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name (as it appears on your license)</FormLabel>
                        <FormControl>
                          <Input placeholder="Alex Rivera" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brokerageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brokerage Name</FormLabel>
                        <FormControl>
                          <Input placeholder="OceanGate Realty" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License State (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="FL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleSkip} className="flex-1">
                  Skip for now
                </Button>
                <Button type="submit" className="flex-1">
                  {isRealtor ? 'Save & Continue' : 'Continue'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
