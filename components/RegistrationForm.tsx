"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { Building2, CheckCircle2, ShieldCheck, Sparkles, UserRound } from "lucide-react";

type RegistrationFormProps = {
  theme: "dark" | "light";
};

export default function RegistrationForm({ theme }: RegistrationFormProps) {
  const [category, setCategory] = useState<"Individual" | "Non-Individual">("Individual");
  const [loading, setLoading] = useState(false);
  const [successBankId, setSuccessBankId] = useState<number | null>(null);
  const [successClientName, setSuccessClientName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const dobInputRef = useRef<HTMLInputElement>(null);
  const incorpDateInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";

  const formatDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = new Date();
  const today = formatDateInputValue(todayDate);
  const maxAdultDobDate = new Date(todayDate.getFullYear() - 18, todayDate.getMonth(), todayDate.getDate());
  const maxAdultDob = formatDateInputValue(maxAdultDobDate);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male",
    orgName: "",
    regNo: "",
    incorpDate: "",
    subType: "Individual",
  });

  const safeShowPicker = (input: HTMLInputElement | null) => {
    if (!input || typeof input.showPicker !== "function") {
      return;
    }

    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  const formatRegistrationNumber = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 12);
    return digitsOnly ? `REG-${digitsOnly}` : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (category === "Individual" && formData.dob && formData.dob > maxAdultDob) {
      setSubmitError("Individual clients must be at least 18 years old.");
      return;
    }

    setLoading(true);

    try {
      const normalizedFirstName = formData.firstName.trim();
      const normalizedLastName = formData.lastName.trim();
      const normalizedOrgName = formData.orgName.trim();
      const normalizedRegNo = formData.regNo.trim();
      const clientDisplayName =
        category === "Individual"
          ? `${normalizedFirstName} ${normalizedLastName}`.trim()
          : normalizedOrgName;

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category,
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          orgName: normalizedOrgName,
          regNo: normalizedRegNo,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const generatedId = Number(result?.data?.[0]?.[0]?.Generated_Bank_ID);
        if (Number.isFinite(generatedId) && generatedId > 0) {
          setSuccessBankId(generatedId);
          setSuccessClientName(clientDisplayName || "Client");
        } else {
          setSubmitError("Registration succeeded but no bank ID was returned.");
        }
      } else {
        setSubmitError(result.error || "Registration failed.");
      }
    } catch {
      setSubmitError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const resetForNextRegistration = () => {
    setSuccessBankId(null);
    setSuccessClientName("");
    setSubmitError("");
    setCategory("Individual");
    setFormData({
      firstName: "",
      lastName: "",
      dob: "",
      gender: "Male",
      orgName: "",
      regNo: "",
      incorpDate: "",
      subType: "Individual",
    });
  };

  const panelClass = "border-[#22363f] bg-linear-to-b from-[#070f15]/90 via-[#050b11]/92 to-[#04080d]/94 shadow-[0_32px_100px_-38px_rgba(42,211,255,0.9)]";

  const titleColor = "text-[#f8fffd]";
  const subtitleColor = "text-[#9eb4b0]";
  const brandColor = "text-[#8ed7cf]";
  const categoryWrapClass = "border-[#21404a] bg-[#0b1b22]/70";
  const individualInputClass = "border-[#22414d] bg-[#0a2029] text-[#e6f4f2] focus:border-[#2dc7b8]";
  const nonIndividualInputClass = "border-[#3d3728] bg-[#221b11] text-[#fff7ec] focus:border-[#ff9f43]";
  const helperTextClass = "text-[#759792]";
  const labelClass = "text-[#95b8b3]";
  const labelWarmClass = "text-[#c9b89f]";

  if (successBankId) {
    return (
      <div className="relative w-full max-w-xl">
        <div className="bank-rainbow-border bank-rainbow-border-off w-full rounded-3xl p-0.5">
          <div className={`relative overflow-hidden rounded-[1.35rem] border p-8 backdrop-blur-2xl ${panelClass} ${isDark ? "" : "brightness-[1.03]"}`}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#2dc7b8]/18 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#ff9f43]/20 blur-3xl" />

            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3f716c] bg-[#0b2f32] text-[#84f8eb]">
                <CheckCircle2 size={34} />
              </div>

              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2f5a62] bg-[#0b1c22]/90 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9bd7d0]">
                <Sparkles size={14} />
                Registration Complete
              </p>

              <h2 className="text-3xl font-black tracking-tight text-[#f8fffd]">Client Registered Successfully</h2>
              <p className="mt-2 text-sm text-[#a8bfba]">The new client profile has been created in the core banking system.</p>

              <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-[#34565e] bg-[#07151c]/90 p-5 text-left shadow-[0_24px_60px_-40px_rgba(45,199,184,0.9)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8db5af]">Client Name</p>
                <p className="mt-2 wrap-break-word text-lg font-bold text-[#e7fffb]">{successClientName}</p>

                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8db5af]">Generated Bank ID</p>
                <p className="mt-2 break-all text-3xl font-black tracking-[0.08em] text-[#8ef3e4]">{successBankId}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-[#88a6a2]">
                  <ShieldCheck size={14} />
                  Keep this ID for all future operations.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForNextRegistration}
                className="mt-8 w-full rounded-2xl bg-[#2dc7b8] py-4 font-bold tracking-wide text-[#03272b] transition-colors hover:bg-[#43ded0]"
              >
                Register Another Client
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="bank-rainbow-border bank-rainbow-border-off w-full rounded-3xl p-0.5">
        <div className={`relative w-full rounded-[1.35rem] border p-8 backdrop-blur-2xl ${panelClass}`}>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5fa8a0]/50 bg-white/90 p-2 shadow-sm">
          <Image src="/logo.png" alt="LITTLE Mini Banking System logo" width={40} height={40} className="h-10 w-10 object-contain" priority />
        </div>
        <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.35em] ${brandColor}`}>LITTLE Mini Banking System</p>
        <h2 className={`text-3xl font-bold tracking-tight ${titleColor}`}>Client Onboarding Portal</h2>
        <p className={`mt-2 text-sm ${subtitleColor}`}>Fast, verified, and profile-aware registration.</p>
      </div>

      <div className={`mb-8 flex rounded-2xl border p-1.5 ${categoryWrapClass}`}>
        <button
          type="button"
          onClick={() => {
            setCategory("Individual");
            setFormData({ ...formData, subType: "Individual" });
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            category === "Individual"
              ? "bg-[#2dc7b8] text-[#022226]"
              : "text-[#7d9794] hover:text-[#c0d6d2]"
          }`}
        >
          <UserRound size={16} />
          Individual
        </button>
        <button
          type="button"
          onClick={() => {
            setCategory("Non-Individual");
            setFormData({ ...formData, subType: "Corporate" });
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            category === "Non-Individual"
              ? "bg-[#ff9f43] text-[#301000]"
              : "text-[#7d9794] hover:text-[#c0d6d2]"
          }`}
        >
          <Building2 size={16} />
          Non-Individual
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-[#5d3232] bg-[#351717]/85 text-[#ffc8c8]" : "border-[#b86c6c] bg-[#fff0f0] text-[#8a2a2a]"}`}>{submitError}</div>
        ) : null}

        {category === "Individual" ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${labelClass}`}>
              <UserRound size={14} />
              Individual Details
            </p>
            <input
              type="text"
              placeholder="First Name"
              required
              className={`w-full rounded-xl border p-3 outline-none transition-colors ${individualInputClass}`}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />

            <input
              type="text"
              placeholder="Last Name"
              required
              className={`w-full rounded-xl border p-3 outline-none transition-colors ${individualInputClass}`}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />

            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.22em] ${labelClass}`}>Date of Birth</label>
              <div className="flex gap-2">
                <input
                  ref={dobInputRef}
                  type="date"
                  required
                  max={maxAdultDob}
                  className={`w-full rounded-xl border p-3 outline-none transition-colors ${individualInputClass}`}
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => safeShowPicker(dobInputRef.current)}
                  className="rounded-xl border border-[#2f5963] bg-[#10303a] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9febe3] transition-colors hover:bg-[#16404d]"
                >
                  Pick
                </button>
              </div>
              <p className={`mt-1 text-xs ${helperTextClass}`}>Use the calendar picker. Minimum age for individuals is 18 years.</p>
            </div>

            <select
              className={`w-full rounded-xl border p-3 outline-none transition-colors ${individualInputClass}`}
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select
              className={`w-full rounded-xl border p-3 outline-none transition-colors ${individualInputClass}`}
              value={formData.subType}
              onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
            >
              <option value="Individual">Individual Client</option>
              <option value="Minor">Minor</option>
              <option value="Group">Group</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${labelWarmClass}`}>
              <Building2 size={14} />
              Organization Details
            </p>
            <input
              type="text"
              placeholder="Organization Name"
              required
              className={`w-full rounded-xl border p-3 outline-none transition-colors ${nonIndividualInputClass}`}
              value={formData.orgName}
              onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
            />

            <input
              type="text"
              placeholder="Registration Number (e.g. REG-88990)"
              required
              inputMode="numeric"
              className={`w-full rounded-xl border p-3 outline-none transition-colors ${nonIndividualInputClass}`}
              value={formData.regNo}
              onChange={(e) => setFormData({ ...formData, regNo: formatRegistrationNumber(e.target.value) })}
            />
            <p className={`-mt-2 text-xs ${helperTextClass}`}>Format: REG- followed by numbers.</p>

            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.22em] ${labelWarmClass}`}>Incorporation Date (optional)</label>
              <div className="flex gap-2">
                <input
                  ref={incorpDateInputRef}
                  type="date"
                  max={today}
                  className={`w-full rounded-xl border p-3 outline-none transition-colors ${nonIndividualInputClass}`}
                  value={formData.incorpDate}
                  onChange={(e) => setFormData({ ...formData, incorpDate: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => safeShowPicker(incorpDateInputRef.current)}
                  className="rounded-xl border border-[#5b4a2d] bg-[#342510] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd5a3] transition-colors hover:bg-[#493314]"
                >
                  Pick
                </button>
              </div>
            </div>

            <select
              className={`w-full rounded-xl border p-3 outline-none transition-colors ${nonIndividualInputClass}`}
              value={formData.subType}
              onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
            >
              <option value="Corporate">Corporate</option>
              <option value="Association">Association</option>
              <option value="Bank">Bank</option>
              <option value="NGO">NGO</option>
            </select>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className={`w-full rounded-2xl py-4 font-bold tracking-wide transition-all duration-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
            category === "Individual"
              ? "bg-[#2dc7b8] text-[#03272b] hover:bg-[#43ded0]"
              : "bg-[#ff9f43] text-[#2f1200] hover:bg-[#ffaf62]"
          }`}
        >
          {loading ? "Processing..." : "Create Client Profile"}
        </button>
      </form>
        </div>
      </div>
    </div>
  );
}