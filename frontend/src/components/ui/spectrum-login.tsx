"use client";

import { useState } from "react";
import { motion, easeOut } from "framer-motion";
import { MoveRight } from "lucide-react";
import { TextMorph } from "./text-morph";

// Adapted from Spectrum UI Login Card: retains staggered card/button structure.
// Google sign-in (Firebase Auth) replaces the source's email-link authentication,
// the same login the /operator/ page uses.
export default function LoginPage({
  onLogin,
}: {
  onLogin: () => Promise<void>;
}) {
  const [status, setStatus] = useState("Sign in with Google");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("Signing In");
    try {
      await onLogin();
      setStatus("Signed In");
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      setError(
        code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
          ? "Sign-in was cancelled."
          : code === "auth/configuration-not-found" || code === "auth/operation-not-allowed"
            ? "Google sign-in is not enabled for this project yet."
            : code === "auth/unauthorized-domain"
              ? "This web address is not yet allowed for sign-in."
              : (e as Error).message,
      );
      setStatus("Sign in with Google");
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
                Sign in to update the free beds of your shelter.
              </p>
            </motion.div>

            <form onSubmit={submit}>
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
                disabled={status === "Signing In"}
                className="primary login-submit"
              >
                <TextMorph as="span">{status}</TextMorph>
                <MoveRight size={18} />
              </motion.button>
            </form>
            <motion.div variants={itemVariants} className="demo-credentials">
              <strong>For shelter staff</strong>
              <p>
                Use any Google account. After signing in you pick the shelter
                you run once; you can change it later.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
