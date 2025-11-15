import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RealEstateDetailsSchema, RealEstateDetailsFormValues } from "@/schema/realEstate";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface RealEstateDetailsFormProps {
  defaultValues?: Partial<RealEstateDetailsFormValues>;
  onChange?: (values: RealEstateDetailsFormValues) => void;
  onSubmit?: (values: RealEstateDetailsFormValues) => void;
  submitLabel?: string;
}

export function RealEstateDetailsForm(props: RealEstateDetailsFormProps) {
  const { defaultValues, onChange, onSubmit, submitLabel = "Save Real Estate Details" } = props;

  const form = useForm<RealEstateDetailsFormValues>({
    resolver: zodResolver(RealEstateDetailsSchema),
    defaultValues: {
      propertyType: "",
      city: "",
      stateOrRegion: "",
      neighborhood: "",
      price: "",
      bedrooms: undefined,
      bathrooms: undefined,
      squareFeet: undefined,
      keyFeatures: "",
      nearbyHighlights: "",
      realtorName: "",
      brokerageName: "",
      includeEHO: true,
      ...defaultValues,
    },
  });

  const values = form.watch();

  useEffect(() => {
    if (onChange) {
      const parsed = RealEstateDetailsSchema.safeParse(values);
      if (parsed.success) {
        onChange(parsed.data);
      }
    }
  }, [values, onChange]);

  function handleSubmit(data: RealEstateDetailsFormValues) {
    onSubmit?.(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Studio apartment" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="$2,500/mo or $450,000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Miami" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stateOrRegion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Region</FormLabel>
                <FormControl>
                  <Input placeholder="FL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Neighborhood (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Brickell" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrooms</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="1" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathrooms</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.5" placeholder="1" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="squareFeet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Square Feet</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="550" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="keyFeatures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Features (comma-separated)</FormLabel>
              <FormControl>
                <Textarea placeholder="Modern kitchen, Balcony, In-unit laundry" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nearbyHighlights"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nearby Highlights (comma-separated)</FormLabel>
              <FormControl>
                <Textarea placeholder="Cafés, Transit, Parks, Beach" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="realtorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Realtor Name</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="includeEHO"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Include Equal Housing Opportunity</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Automatically include "Equal Housing Opportunity" in your ad footer.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {onSubmit && (
          <Button type="submit" className="w-full md:w-auto">
            {submitLabel}
          </Button>
        )}
      </form>
    </Form>
  );
}
