"use client";

import { useState } from "react";
import { motion, easeOut } from "framer-motion";
import { MoveRight } from "lucide-react";
import { TextMorph } from "./text-morph";

// Adapted from Spectrum UI Login Card: retains staggered card/input/button structure.
// Password authentication replaces the source's email-link/social authentication.
export default function LoginPage({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Log In");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("Logging In");
    try {
      await onLogin(email, password);
      setStatus("Logged In");
    } catch (e) {
      setError((e as Error).message);
      setStatus("Log In");
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: easeOut },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  };

  return (
    <div className="spectrum-login w-full">
      <div className="relative z-10 flex items-center justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-[#3F3F3F] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl "
          >
            <motion.div variants={itemVariants} className="text-center mb-8">
              <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                A little care. A big difference.
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Sign in to update your assigned shelter.
              </p>
            </motion.div>

            <form onSubmit={submit}>
              <motion.div variants={itemVariants} className="mb-6">
                <label htmlFor="email">Email address</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@your-shelter.org"
                    required
                    className="w-full rounded-full px-6 py-4"
                  />
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="mb-6">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-full px-6 py-4"
                />
              </motion.div>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <motion.button
                type="submit"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                disabled={status === "Logging In"}
                className="primary login-submit"
              >
                <TextMorph as="span">{status}</TextMorph>
                <MoveRight size={18} />
              </motion.button>
            </form>
            <motion.div variants={itemVariants} className="demo-credentials">
              <strong>Try the worker demo</strong>
              <p>Fictional accounts, for this prototype only.</p>
              <button
                type="button"
                onClick={() => {
                  setEmail("anna@demo-shelter.example");
                  setPassword("Demo123!");
                }}
              >
                Use Anna's demo account ↗
              </button>
              <p>
                anna@demo-shelter.example
                <br />
                Password: Demo123!
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
