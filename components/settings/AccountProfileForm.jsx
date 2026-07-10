import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { handleChangeEmail, handleChangePassword, handleLogout } from "../../utils/authUtils";
import { useAuth } from "../../context/AuthContext";
import PasswordDialog from "../PasswordDialog/PasswordDialog";
import DeleteAccountDialog from "./DeleteAccountDialog";
import { handleUpdateFirestore } from "../../utils/firestoreUtils";
import { deleteAccountWithReauth } from "../../utils/accountDeletionClient";

const formStyles = {
  settingsForm: {
    width: "100%",
    maxWidth: "720px",
    display: "flex",
    flexDirection: "column",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    fontSize: "16px",
    transition: "all 0.3s ease",
    backgroundColor: "white",
    boxSizing: "border-box",
  },
  saveButton: {
    width: "100%",
    padding: "15px 24px",
    marginBottom: "2rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    color: "white",
    borderRadius: "25px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid transparent",
    borderTop: "2px solid currentColor",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  actionsContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "2rem",
  },
  logoutButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "16px",
    cursor: "pointer",
    textDecoration: "underline",
    padding: "0.5rem",
  },
  dangerZone: {
    marginTop: "1rem",
    marginBottom: "2rem",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    backgroundColor: "#fff5f5",
  },
  dangerTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#991b1b",
  },
  dangerText: {
    marginTop: "0.5rem",
    marginBottom: "1rem",
    fontSize: "14px",
    color: "#7f1d1d",
    lineHeight: 1.5,
  },
  deleteButton: {
    background: "#dc2626",
    border: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "10px",
    padding: "10px 16px",
  },
  snackbar: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
  },
  alert: {
    padding: "12px 24px",
    backgroundColor: "#e3f2fd",
    color: "#0277bd",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontSize: "14px",
  },
};

/** Profil utilizator — aceleași câmpuri Firestore Users ca înainte: first_name, last_name, email (plus flux Auth pentru parolă/e-mail). */
export default function AccountProfileForm({
  footerSlot,
  /** Footer opțional (ex. copyright) sub formular — în afara `<form>` */
}) {
  const { currentUser, setAsGuestUser, setUserData, userData, setCurrentUser } = useAuth();
  const { t } = useTranslation("common");
  const router = useRouter();

  const [message, setMessage] = React.useState("");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [last_name, setLastName] = React.useState("");
  const [first_name, setFirstName] = React.useState("");
  const hydratedForUid = React.useRef(null);

  React.useEffect(() => {
    const uid = userData?.owner_uid;
    if (!uid) return;
    if (hydratedForUid.current === uid) return;
    hydratedForUid.current = uid;
    setFirstName(userData.first_name || "");
    setLastName(userData.last_name || "");
    setEmail(userData.email || currentUser?.email || "");
  }, [userData, currentUser?.email]);

  const handleResetForm = () => {
    setConfirmPassword("");
    setPassword("");
    setFirstName(userData?.first_name || "");
    setLastName(userData?.last_name || "");
    setEmail(userData?.email || currentUser?.email || "");
  };

  const showToast = (msg) => {
    setMessage(msg);
    setShowSnackback(true);
  };

  const handleDeleteAccount = async ({ currentPassword }) => {
    setDeleteLoading(true);
    try {
      await deleteAccountWithReauth(currentPassword);
      showToast(t("deleteAccountSuccess"));
      await handleLogout();
      setCurrentUser(null);
      setUserData(null);
      setAsGuestUser(false);
      router.push("/login");
    } catch (error) {
      console.error("[settings] delete_account_failed", error);
      showToast(t("deleteAccountError"));
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }
    setIsLoading(true);

    if (password && currentPassword.length === 0 && password === confirmPassword) {
      setModalVisible(true);
    } else if (password && currentPassword.length > 0) {
      handleChangePassword(currentPassword, password).then(() => {
        showToast(t("settingsPasswordChangedSuccess"));
        setModalVisible(false);
        handleResetForm();
      });
    }

    if (email && currentPassword.length === 0) {
      setModalVisible(true);
    } else if (email && currentPassword.length > 0) {
      handleChangeEmail(currentPassword, email).then((emailMsg) => {
        if (emailMsg.length > 0) {
          showToast(emailMsg);
        } else {
          showToast(t("settingsEmailChangeVerifyHint"));
        }
        setModalVisible(false);
        handleResetForm();
      });
    }

    const namePatch = {};
    if (first_name?.trim()) namePatch.first_name = first_name.trim();
    if (last_name?.trim()) namePatch.last_name = last_name.trim();
    if (Object.keys(namePatch).length > 0 && userData?.owner_uid) {
      const copyUserData = { ...userData, ...namePatch };
      const userLocation = `Users/${userData.owner_uid}`;
      setUserData(copyUserData);
      handleUpdateFirestore(userLocation, copyUserData)
        .then(() => {
          showToast(t("settingsNameUpdatedSuccess"));
          handleResetForm();
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    }

    setIsLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={formStyles.settingsForm}>
        <div style={formStyles.inputGroup}>
          <label htmlFor="settings-cont-first-name" style={formStyles.label}>
            {t("firstName")}
          </label>
          <input
            type="text"
            id="settings-cont-first-name"
            name="first-name"
            autoComplete="given-name"
            onChange={(e) => setFirstName(e.target.value)}
            value={first_name}
            style={formStyles.input}
            placeholder={t("firstName")}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label htmlFor="settings-cont-last-name" style={formStyles.label}>
            {t("lastName")}
          </label>
          <input
            type="text"
            id="settings-cont-last-name"
            name="last-name"
            autoComplete="family-name"
            onChange={(e) => setLastName(e.target.value)}
            value={last_name}
            style={formStyles.input}
            placeholder={t("lastName")}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label htmlFor="settings-cont-email" style={formStyles.label}>
            {t("email")}
          </label>
          <input
            type="email"
            id="settings-cont-email"
            name="email"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            style={formStyles.input}
            placeholder={t("email")}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label htmlFor="settings-cont-new-password" style={formStyles.label}>
            {t("createPassword")}
          </label>
          <input
            type="password"
            id="settings-cont-new-password"
            name="newPassword"
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            style={formStyles.input}
            placeholder={t("createPassword")}
          />
        </div>

        <div style={formStyles.inputGroup}>
          <label htmlFor="settings-cont-confirm-password" style={formStyles.label}>
            {t("confirmPassword")}
          </label>
          <input
            type="password"
            id="settings-cont-confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            style={formStyles.input}
            placeholder={t("confirmPassword")}
          />
        </div>

        <button type="submit" style={formStyles.saveButton} disabled={isLoading}>
          {isLoading ? <div style={formStyles.spinner} /> : t("saveChanges")}
        </button>

        <div style={formStyles.actionsContainer}>
          <button
            type="button"
            onClick={() => {
              handleLogout().then(() => {
                setCurrentUser(null);
                setUserData(null);
                setAsGuestUser(false);
                router.push("/login");
              });
            }}
            style={formStyles.logoutButton}
          >
            {t("logOut")}
          </button>
        </div>

        <div style={formStyles.dangerZone}>
          <p style={formStyles.dangerTitle}>{t("deleteAccountDangerZoneTitle")}</p>
          <p style={formStyles.dangerText}>{t("deleteAccountDangerZoneBody")}</p>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            style={formStyles.deleteButton}
            disabled={deleteLoading}
          >
            {t("deleteAccount")}
          </button>
        </div>
      </form>

      {footerSlot ? <div>{footerSlot}</div> : null}

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
      />

      <PasswordDialog
        setModalVisible={setModalVisible}
        modalVisible={modalVisible}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        handleSubmit={handleSubmit}
      />

      {showSnackback ? (
        <div style={formStyles.snackbar}>
          <div style={formStyles.alert}>{message}</div>
        </div>
      ) : null}
    </>
  );
}
