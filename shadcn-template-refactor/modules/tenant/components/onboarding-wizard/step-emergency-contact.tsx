// =============================================================================
// Step 3: Emergency Contact — Add emergency contact information
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, User2, Plus, X, Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { EmergencyContact } from "../../types";
import { useTenantOnboardingStore } from "../../store/onboarding-store";
import { emergencyContactSchema, type EmergencyContactValues } from "./onboarding-schema";
import { RELATIONSHIP_OPTIONS } from "./onboarding-types";

export function StepEmergencyContact() {
  const { data, addEmergencyContact, removeEmergencyContact } =
    useTenantOnboardingStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddContact = useCallback(
    (contact: EmergencyContact) => {
      addEmergencyContact(contact);
      setIsDialogOpen(false);
    },
    [addEmergencyContact]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="size-5" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>
            Add at least one emergency contact who can be reached in case of
            emergencies. This person should be aware that they may be contacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact list */}
          {data.emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {data.emergencyContacts.map((contact, index) => (
                <ContactCard
                  key={index}
                  contact={contact}
                  onRemove={() => removeEmergencyContact(index)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <User2 className="size-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No emergency contacts added yet
              </p>
            </div>
          )}

          {/* Add contact button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={data.emergencyContacts.length >= 3}
              >
                <Plus className="mr-2 size-4" />
                Add Emergency Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Emergency Contact</DialogTitle>
              </DialogHeader>
              <AddContactForm onSubmit={handleAddContact} />
            </DialogContent>
          </Dialog>

          {/* Limit message */}
          {data.emergencyContacts.length >= 3 && (
            <p className="text-center text-sm text-muted-foreground">
              Maximum of 3 emergency contacts allowed
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="mb-2 text-sm font-medium">Tips for Emergency Contacts</h4>
          <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
            <li>Choose someone who is easily reachable</li>
            <li>Inform them that they have been listed as your emergency contact</li>
            <li>
              Consider adding contacts from different locations (e.g., work and home)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Card
// ---------------------------------------------------------------------------

interface ContactCardProps {
  contact: EmergencyContact;
  onRemove: () => void;
}

function ContactCard({ contact, onRemove }: ContactCardProps) {
  const relationshipLabel =
    RELATIONSHIP_OPTIONS.find((r) => r.value === contact.relationship)?.label ||
    contact.relationship;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <User2 className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{contact.name}</p>
          <p className="text-sm text-muted-foreground">{relationshipLabel}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{contact.phone}</span>
            {contact.email && <span>{contact.email}</span>}
          </div>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <X className="size-4" />
        <span className="sr-only">Remove contact</span>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Contact Form
// ---------------------------------------------------------------------------

interface AddContactFormProps {
  onSubmit: (contact: EmergencyContact) => void;
}

function AddContactForm({ onSubmit }: AddContactFormProps) {
  const form = useForm<EmergencyContactValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      name: values.name,
      relationship: values.relationship,
      phone: values.phone,
      email: values.email || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter contact's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="e.g., 0123456789"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit">Add Contact</Button>
        </div>
      </form>
    </Form>
  );
}
