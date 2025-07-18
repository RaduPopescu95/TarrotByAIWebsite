import React, { useState } from "react";
import { useTranslation } from "next-i18next";

function SubscribeForm() {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle subscription logic here
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h3 style={styles.title}>{t("subscribe")}</h3>
        <p style={styles.subtitle}>{t("subscribeDescription")}</p>
        
        {!subscribed ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputContainer}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enterEmail")}
                style={styles.input}
                required
              />
              <button type="submit" style={styles.button}>
                {t("subscribe")}
              </button>
            </div>
          </form>
        ) : (
          <div style={styles.successMessage}>
            {t("subscriptionSuccess")}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#667eea",
    padding: "3rem 2rem",
    borderRadius: "8px",
    marginTop: "2rem",
  },
  content: {
    maxWidth: "500px",
    margin: "0 auto",
    textAlign: "center",
  },
  title: {
    color: "white",
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "1rem",
    marginBottom: "2rem",
    lineHeight: "1.5",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    display: "flex",
    gap: "0.5rem",
    flexDirection: "column",
    "@media (min-width: 768px)": {
      flexDirection: "row",
    },
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "4px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    fontSize: "1rem",
    "::placeholder": {
      color: "rgba(255, 255, 255, 0.7)",
    },
  },
  button: {
    backgroundColor: "#764ba2",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "12px 24px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    "&:hover": {
      backgroundColor: "#5a3a7a",
    },
  },
  successMessage: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    padding: "1rem",
    borderRadius: "4px",
    fontSize: "1rem",
  },
};

export default SubscribeForm;
