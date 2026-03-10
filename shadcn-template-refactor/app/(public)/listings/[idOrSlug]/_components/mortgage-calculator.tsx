/**
 * Mortgage Calculator Widget
 *
 * Interactive calculator for monthly mortgage instalment estimation.
 * Tailored to the Malaysian market (BNM base rate defaults).
 *
 * Formula: M = P[r(1+r)^n] / [(1+r)^n - 1]
 * Where: P = principal, r = monthly interest rate, n = total months
 */

"use client";

import { useState, useMemo } from "react";
import { Calculator, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MortgageCalculatorProps {
  /** Listing price in MYR — used as default property price */
  price: number;
  /** Currency code for formatting */
  currency?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default interest rate for Malaysian home loans (approximate BNM base rate + spread) */
const DEFAULT_INTEREST_RATE = 4.5;
const DEFAULT_DOWN_PAYMENT_PCT = 10;
const DEFAULT_TENURE_YEARS = 30;

const MIN_INTEREST = 1;
const MAX_INTEREST = 15;
const MIN_DOWN_PAYMENT = 0;
const MAX_DOWN_PAYMENT = 90;
const MIN_TENURE = 5;
const MAX_TENURE = 35;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MortgageCalculator({
  price,
  currency = "MYR",
}: MortgageCalculatorProps) {
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const [downPaymentPct, setDownPaymentPct] = useState(DEFAULT_DOWN_PAYMENT_PCT);
  const [tenureYears, setTenureYears] = useState(DEFAULT_TENURE_YEARS);

  const calculation = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const principal = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = tenureYears * 12;

    if (principal <= 0 || monthlyRate <= 0 || totalMonths <= 0) {
      return {
        monthlyPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        downPayment,
        principal,
      };
    }

    // M = P[r(1+r)^n] / [(1+r)^n - 1]
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - principal;

    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
      downPayment,
      principal,
    };
  }, [price, interestRate, downPaymentPct, tenureYears]);

  const fmt = (value: number) =>
    new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Don't show calculator for very low-price listings or price upon request
  if (price <= 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="p-6">
        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">
          <Calculator className="h-4 w-4" />
          Mortgage Calculator
        </h2>

        <div className="space-y-5">
          {/* Property Price (read-only) */}
          <div>
            <Label className="text-xs text-muted-foreground">Property Price</Label>
            <p className="text-lg font-semibold">{fmt(price)}</p>
          </div>

          <div className="border-t border-border/50" />

        {/* Down Payment % */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Down Payment</Label>
            <span className="text-sm font-medium">
              {downPaymentPct}% ({fmt(calculation.downPayment)})
            </span>
          </div>
          <Slider
            value={[downPaymentPct]}
            onValueChange={([v]) => setDownPaymentPct(v)}
            min={MIN_DOWN_PAYMENT}
            max={MAX_DOWN_PAYMENT}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_DOWN_PAYMENT}%</span>
            <span>{MAX_DOWN_PAYMENT}%</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label className="text-sm">Interest Rate</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-50 text-xs">
                      Current Malaysia base rate is around 3.0%. Add bank spread
                      (~1-1.5%) for effective rate.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={interestRate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= MIN_INTEREST && v <= MAX_INTEREST) {
                    setInterestRate(v);
                  }
                }}
                className="h-7 w-16 text-right text-sm"
                step={0.1}
                min={MIN_INTEREST}
                max={MAX_INTEREST}
              />
              <span className="text-sm">%</span>
            </div>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={([v]) => setInterestRate(Math.round(v * 10) / 10)}
            min={MIN_INTEREST}
            max={MAX_INTEREST}
            step={0.1}
          />
        </div>

        {/* Loan Tenure */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Loan Tenure</Label>
            <span className="text-sm font-medium">{tenureYears} years</span>
          </div>
          <Slider
            value={[tenureYears]}
            onValueChange={([v]) => setTenureYears(v)}
            min={MIN_TENURE}
            max={MAX_TENURE}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_TENURE} yrs</span>
            <span>{MAX_TENURE} yrs</span>
          </div>
        </div>

        <div className="border-t border-border/50" />

        {/* Results */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-primary/5 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Estimated Monthly Payment
            </p>
            <p className="text-2xl font-bold text-primary">
              {fmt(calculation.monthlyPayment)}
            </p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Loan Amount</p>
              <p className="font-medium">{fmt(calculation.principal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="font-medium">{fmt(calculation.totalInterest)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Total Repayment</p>
              <p className="font-medium">{fmt(calculation.totalPayment)}</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] leading-tight text-muted-foreground">
          * This is an estimate only. Actual rates and repayments may vary.
          Consult your bank for accurate figures.
        </p>
        </div>
      </div>
    </div>
  );
}
