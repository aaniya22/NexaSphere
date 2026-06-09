import { useStudentAuth } from '../../context/StudentAuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login, user, logout } = useStudentAuth();

  if (user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.heading}>Welcome, {user.name || user.email}</h1>
          <p className={styles.text}>
            You are signed in as <strong>{user.role}</strong>.
          </p>
          <button className={styles.btnDanger} onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Sign In to NexaSphere</h1>
        <p className={styles.text}>Choose your preferred sign-in method</p>
        <div className={styles.buttons}>
          <button className={styles.btnGoogle} onClick={() => login('google')}>
            <span className={styles.btnIcon}>G</span>
            Sign in with Google
          </button>
          <button className={styles.btnGitHub} onClick={() => login('github')}>
            <span className={styles.btnIcon}>&#xf09b;</span>
            Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
