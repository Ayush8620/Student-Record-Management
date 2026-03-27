import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch role
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === "admin") navigate("/admin");
        else if (role === "teacher") navigate("/teacher");
        else if (role === "student") navigate("/student");
        else throw new Error("Invalid user role assigned!");
      } else {
        throw new Error("User record not found in system.");
      }
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden w-full">
      {/* Background Architectural Element */}
      <div className="absolute inset-0 z-0">
        <img alt="Campus Background" className="w-full h-full object-cover" src="/login-bg.jpg" />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[480px]">
        {/* Brand Identity */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-6 shadow-[0px_20px_40px_rgba(0,63,177,0.15)]">
            <span className="material-symbols-outlined text-on-primary text-3xl">auto_stories</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">ERP Portal</h1>
          <p className="text-on-surface-variant font-medium tracking-wide text-sm uppercase">Student Record Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/85 backdrop-blur-md rounded-xl p-10 shadow-[0px_40px_80px_rgba(0,0,0,0.08)] border border-white/50 ring-1 ring-black/5">
          <header className="mb-8">
            <h2 className="text-2xl font-bold font-headline text-on-surface mb-1">Welcome back !</h2>
            <p className="text-on-surface-variant text-sm">Please enter your academic credentials to continue.</p>
          </header>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm text-center font-semibold">
                {error}
              </div>
            )}

            {/* ID Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="student-id">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl transition-colors group-focus-within:text-primary">badge</span>
                </div>
                <input
                  className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-transparent outline-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-surface-container-lowest transition-all duration-300 text-on-surface placeholder:text-outline"
                  id="student-id"
                  name="student-id"
                  placeholder="name@university.edu"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <a className="text-xs font-semibold text-primary hover:text-primary-container transition-colors" href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl transition-colors group-focus-within:text-primary">lock</span>
                </div>
                <input
                  className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border-transparent outline-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-surface-container-lowest transition-all duration-300 text-on-surface placeholder:text-outline"
                  id="password"
                  name="password"
                  placeholder="••••••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center px-1">
              <input className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded transition-all" id="remember-me" name="remember-me" type="checkbox" />
              <label className="ml-3 block text-sm text-on-surface-variant" htmlFor="remember-me">
                Stay signed in for 30 days
              </label>
            </div>

            {/* Login Button */}
            <button
              className={`w-full py-4 font-bold rounded-lg shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group ${loading ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary text-on-primary hover:bg-primary-container shadow-primary/20"}`}
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Signing in..." : "Sign In to Portal"}</span>
              {!loading && <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </form>

          {/* Footer Assistance */}
          <footer className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
            <p className="text-sm text-on-surface-variant">
              New user? <a className="text-primary font-bold hover:underline" href="#">Request access</a>
            </p>
          </footer>
        </div>

        {/* System Status / Security Note */}
        <div className="mt-8 flex items-center justify-center gap-6 text-on-surface-variant/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified_user</span>

          </div>
          <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-xs font-medium tracking-wide">Systems Operational</span>
          </div>
        </div>
      </main>

      {/* Decorative Top Right Asset */}
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-primary-fixed/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-tertiary-fixed/20 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}
