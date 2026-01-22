import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  Button,
  Input,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/ui";
import { User, Phone, Mail, MapPin, Building2 } from "lucide-react";
import type { Customer, CustomerFormData, CustomerType } from "../types";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(100),
  type: z.enum(["customer", "supplier", "both"]),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  taxId: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(10).optional(),
  openingBalance: z.number().optional(),
  creditLimit: z.number().min(0).optional(),
  creditDays: z.number().min(0).max(365).optional(),
  notes: z.string().max(500).optional(),
});

type CustomerSchemaType = z.infer<typeof customerSchema>;

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  customer?: Customer | null;
  isLoading?: boolean;
}

// ============================================================================
// OPTIONS
// ============================================================================

const typeOptions: SelectOption[] = [
  { value: "customer", label: "Customer" },
  { value: "supplier", label: "Supplier" },
  { value: "both", label: "Both (Customer & Supplier)" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  isLoading,
}: CustomerFormModalProps): React.ReactNode {
  const isEditing = Boolean(customer);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "credit">(
    "basic"
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerSchemaType>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      type: "customer",
      phone: "",
      email: "",
      taxId: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      openingBalance: 0,
      creditLimit: 0,
      creditDays: 0,
      notes: "",
    },
  });

  const selectedType = watch("type");

  // Reset form when customer changes
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        type: customer.type,
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        taxId: customer.taxId ?? "",
        address: customer.address ?? "",
        city: customer.city ?? "",
        state: customer.state ?? "",
        zipCode: customer.zipCode ?? "",
        openingBalance: customer.openingBalance,
        creditLimit: customer.creditLimit ?? 0,
        creditDays: customer.creditDays ?? 0,
        notes: customer.notes ?? "",
      });
    } else {
      reset({
        name: "",
        type: "customer",
        phone: "",
        email: "",
        taxId: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        openingBalance: 0,
        creditLimit: 0,
        creditDays: 0,
        notes: "",
      });
    }
    setActiveTab("basic");
  }, [customer, reset, isOpen]);

  const handleFormSubmit = (data: CustomerSchemaType): void => {
    onSubmit({
      ...data,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
      taxId: data.taxId ?? undefined,
      address: data.address ?? undefined,
      city: data.city ?? undefined,
      state: data.state ?? undefined,
      zipCode: data.zipCode ?? undefined,
      notes: data.notes ?? undefined,
    });
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "details", label: "Address & Tax" },
    { id: "credit", label: "Credit Settings" },
  ] as const;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={isEditing ? "Edit Customer" : "Add New Customer"}
      description={
        isEditing ? `Update ${customer?.name}` : "Add a customer or supplier"
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit(handleFormSubmit)();
            }}
            isLoading={isLoading}
          >
            {isEditing ? "Update Customer" : "Add Customer"}
          </Button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
            }}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="space-y-4">
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <>
            <Input
              label="Customer Name"
              required
              placeholder="Enter customer name"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.name?.message}
              {...register("name")}
            />

            <Select
              label="Customer Type"
              required
              options={typeOptions}
              value={selectedType}
              onChange={(value) => {
                setValue("type", value as CustomerType);
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                placeholder="Enter phone"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register("phone")}
              />

              <Input
                label="Email"
                type="email"
                placeholder="Enter email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            {!isEditing && (
              <Input
                label="Opening Balance"
                type="number"
                placeholder="0"
                helperText="Positive = To Receive, Negative = To Pay"
                {...register("openingBalance", { valueAsNumber: true })}
              />
            )}
          </>
        )}

        {/* Address & Tax Tab */}
        {activeTab === "details" && (
          <>
            <Textarea
              label="Address"
              placeholder="Enter full address"
              rows={3}
              error={errors.address?.message}
              {...register("address")}
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                placeholder="City"
                leftIcon={<MapPin className="h-4 w-4" />}
                error={errors.city?.message}
                {...register("city")}
              />

              <Input
                label="State"
                placeholder="State"
                error={errors.state?.message}
                {...register("state")}
              />

              <Input
                label="ZIP Code"
                placeholder="ZIP Code"
                error={errors.zipCode?.message}
                {...register("zipCode")}
              />
            </div>

            <Input
              label="Tax ID / EIN"
              placeholder="XX-XXXXXXX"
              helperText="Employer Identification Number or Tax ID"
              leftIcon={<Building2 className="h-4 w-4" />}
              error={errors.taxId?.message}
              {...register("taxId")}
            />
          </>
        )}

        {/* Credit Settings Tab */}
        {activeTab === "credit" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Credit Limit"
                type="number"
                placeholder="0"
                helperText="Maximum credit allowed"
                error={errors.creditLimit?.message}
                {...register("creditLimit", { valueAsNumber: true })}
              />

              <Input
                label="Credit Days"
                type="number"
                placeholder="0"
                helperText="Payment due days"
                error={errors.creditDays?.message}
                {...register("creditDays", { valueAsNumber: true })}
              />
            </div>

            <Textarea
              label="Notes"
              placeholder="Additional notes about this customer..."
              rows={4}
              error={errors.notes?.message}
              {...register("notes")}
            />
          </>
        )}
      </form>
    </Sheet>
  );
}
