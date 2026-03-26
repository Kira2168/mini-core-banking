"use client";
import Image from "next/image";
import { useRef, useState } from "react";

type RegistrationFormProps = {
  theme: "dark" | "light";
};

export default function RegistrationForm({ theme }: RegistrationFormProps) {
  const [category, setCategory] = useState<"Individual" | "Non-Individual">("Individual");
  const [loading, setLoading] = useState(false);
  const dobInputRef = useRef<HTMLInputElement>(null);
  const incorpDateInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";

  const today = new Date().toISOString().split("T")[0];

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
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          orgName: formData.orgName.trim(),
          regNo: formData.regNo.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        const generatedId = result.data[0][0].Generated_Bank_ID;
        alert(`Success! Client registered. Bank ID: ${generatedId}`);

        setFormData({
          firstName: "",
          lastName: "",
          dob: "",
          gender: "Male",
          orgName: "",
          regNo: "",
          incorpDate: "",
          subType: category === "Individual" ? "Individual" : "Corporate",
        });
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const panelClass = isDark
    ? "border-[#1f2d32] bg-linear-to-b from-[#091418]/95 to-[#051015]/95 shadow-[0_20px_80px_-35px_rgba(21,176,184,0.75)]"
    : "border-[#b9d8d4] bg-linear-to-b from-[#f8fffe]/95 to-[#ecf6f5]/95 shadow-[0_22px_70px_-35px_rgba(20,78,86,0.45)]";

  const titleColor = isDark ? "text-[#f8fffd]" : "text-[#0d3438]";
  const subtitleColor = isDark ? "text-[#9eb4b0]" : "text-[#4f6f6c]";
  const brandColor = isDark ? "text-[#8ed7cf]" : "text-[#2e6e67]";
  const categoryWrapClass = isDark ? "border-[#21404a] bg-[#0b1b22]/70" : "border-[#b6d0cd] bg-[#e4f1ef]/90";
  const individualInputClass = isDark
    ? "border-[#22414d] bg-[#0a2029] text-[#e6f4f2] focus:border-[#2dc7b8]"
    : "border-[#9ec7c2] bg-[#f6fffd] text-[#11383c] focus:border-[#1ea696]";
  const nonIndividualInputClass = isDark
    ? "border-[#3d3728] bg-[#221b11] text-[#fff7ec] focus:border-[#ff9f43]"
    : "border-[#d2bf9f] bg-[#fff9f0] text-[#50340f] focus:border-[#e48a33]";
  const helperTextClass = isDark ? "text-[#759792]" : "text-[#5d8782]";
  const labelClass = isDark ? "text-[#95b8b3]" : "text-[#456a66]";
  const labelWarmClass = isDark ? "text-[#c9b89f]" : "text-[#886844]";

  return (
    <div className={`w-full max-w-xl rounded-3xl border p-8 backdrop-blur-xl ${panelClass}`}>
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
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            category === "Individual"
              ? "bg-[#2dc7b8] text-[#022226]"
              : "text-[#7d9794] hover:text-[#c0d6d2]"
          }`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => {
            setCategory("Non-Individual");
            setFormData({ ...formData, subType: "Corporate" });
          }}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            category === "Non-Individual"
              ? "bg-[#ff9f43] text-[#301000]"
              : "text-[#7d9794] hover:text-[#c0d6d2]"
          }`}
        >
          Non-Individual
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {category === "Individual" ? (
          <div className="space-y-4 animate-in fade-in duration-500">
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
                  max={today}
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
              <p className={`mt-1 text-xs ${helperTextClass}`}>Use the calendar picker to select the date.</p>
            </div>

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
  );
}