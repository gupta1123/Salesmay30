import '../styles/globals.css';
import './Login.css';
import './VisitsTimeline.css';
import './Dashboard.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './SalesExecutive/SalesExecutivePage.css';
import './VisitsList.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Complaints.css';
import './DailyPricing.css';
import './CustomerListPage.css';
import './ExpenseCard.css';
import './employeeCard.css';
import 'react-loading-skeleton/dist/skeleton.css';
import './Attendance.css';
import './Expense.css';
import 'react-datepicker/dist/react-datepicker.css';
import './Requirements.css';
import './Approval.css';
import './CustomCalendar.css';
import "./Employeelist.css";
import './EnquiriesPage.css';
import './VisitsTab.css';
import './TaskManagement.css';
import './VisitDetailPage/VisitDetail.css';
import './Report.css';
import './Settings.css';
import './CustomerDetailPage/CustomerDetail.css';
import './CustomerDetailPage/Sites.css';
import './Sales.css';
import '../components/SalesPerformanceReport.css';
import '../components/NewCustomersReport.css';
import '../components/TotalSalesReportComponent.css';
import '../components/SteelIllustrations.css';
import '../components/CustomerTypeAnalysisReport.css';
import '../components/VisitFrequencyReport.css';
import '../components/Layout/Layout.css';
import '../components/FieldOfficerVisitReport.css';
import type { NextPage } from 'next';
import { AppProps } from 'next/app';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './App.module.css';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, setToken, setRole, fetchUserInfo, setupAxiosDefaults, AppDispatch, RootState, loginUser, setModalOpen } from '../store';
import { Button, Input } from 'antd';
import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import SteelIllustrations from '../components/SteelIllustrations';
import SplashScreen from '../components/SplashScreen';

type AppPropsWithLayout = AppProps & {
  Component: NextPage & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };
};

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authStatus = useSelector((state: RootState) => state.auth.status);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const result = await dispatch(loginUser({ username, password })).unwrap();
      if (result.token) {
        router.push('/Dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error || 'An unknown error occurred. Please try again.');
    }
  };

  return (
    <motion.div 
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated background shapes */}
      <motion.div 
        className="shape shape-1"
        animate={{
          y: [0, 20, 0],
          rotate: [0, 10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="shape shape-2"
        animate={{
          y: [0, -30, 0],
          rotate: [0, -15, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="shape shape-3"
        animate={{
          y: [0, 15, 0],
          x: [0, 15, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Left side - Login Form */}
      <motion.div 
        className="login-left"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="login-card">
          <div className="welcome-text">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Sign in to continue to Gajkesari Steel
            </motion.p>
          </div>

          <motion.form 
            className="login-form"
            onSubmit={handleLogin}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-container">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <Input.Password
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errorMessage}
              </motion.div>
            )}

            <Button
              type="primary"
              htmlType="submit"
              className="login-button"
              loading={authStatus === 'loading'}
            >
              {authStatus === 'loading' ? 'Signing in...' : 'Sign In'}
            </Button>
          </motion.form>
        </div>
      </motion.div>

      {/* Right side - Brand Showcase */}
      <motion.div 
        className="login-right"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="brand-showcase">
          <motion.div 
            className="logo-container"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.5 
            }}
          >
            <img 
              src="/GajkesariLogo.jpeg" 
              alt="Gajkesari Steel" 
            />
          </motion.div>
          <motion.h2 
            className="brand-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Gajkesari Steel
          </motion.h2>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CreateDailyPricingModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [newBrand, setNewBrand] = useState({
    brandName: 'Gajkesari',
    price: '',
    city: '',
    employeeDto: { id: 86 }
  });
  const isModalOpen = useSelector((state: RootState) => state.auth.isModalOpen);
  const token = useSelector((state: RootState) => state.auth.token);

  const handleCreateBrand = async () => {
    const newBrandData = {
      ...newBrand,
      price: parseFloat(newBrand.price),
    };

    try {
      const response = await fetch('https://api.gajkesaristeels.in/brand/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBrandData),
      });

      if (response.ok) {
        dispatch(setModalOpen(false));
        setNewBrand({
          brandName: 'Gajkesari',
          price: '',
          city: '',
          employeeDto: { id: 86 }
        });
      } else {
        console.error('Error creating brand');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(isOpen) => dispatch(setModalOpen(isOpen))}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Pricing</DialogTitle>
          <DialogDescription className="mt-2">
            Daily Pricing for today has not been created. Please fill out the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="brandName" className="text-right">
              Brand Name
            </Label>
            <Input
              id="brandName"
              value={newBrand.brandName}
              disabled
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              value={newBrand.price}
              onChange={(e) => setNewBrand({ ...newBrand, price: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              City
            </Label>
            <Input
              id="city"
              value={newBrand.city}
              onChange={(e) => setNewBrand({ ...newBrand, city: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button htmlType="submit" onClick={handleCreateBrand}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Move isTokenValid function outside of AuthWrapper to make it available to MyApp
const isTokenValid = (token: string) => {
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
    return Date.now() < expirationTime;
  } catch (error) {
    return false;
  }
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  // Wrap everything in the Redux Provider
  return (
    <Provider store={store}>
      <AppContent Component={Component} pageProps={pageProps} getLayout={getLayout} />
    </Provider>
  );
}

// Separate component to use Redux hooks
const AppContent = ({ 
  Component, 
  pageProps, 
  getLayout 
}: { 
  Component: AppPropsWithLayout['Component']; 
  pageProps: AppPropsWithLayout['pageProps']; 
  getLayout: (page: React.ReactElement) => React.ReactNode;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // Check for stored token on initialization
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');

    if (storedToken && isTokenValid(storedToken)) {
      // Restore token to Redux state
      dispatch(setToken(storedToken));
      setupAxiosDefaults(storedToken);
      
      if (storedRole) {
        dispatch(setRole(storedRole as RootState['auth']['role']));
      }
      
      if (storedUsername) {
        dispatch(fetchUserInfo(storedUsername));
      }
    }
    
    setIsInitialized(true);
  }, [dispatch]);

  const isValidToken = token && isTokenValid(token);

  useEffect(() => {
    if (isValidToken) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isValidToken]);

  // Show loading state during initialization
  if (!isInitialized) {
    return <SplashScreen />;
  }

  if (!isValidToken) {
    return <LoginPage />;
  }

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthWrapper>
      <CreateDailyPricingModal />
      <div className={styles.appContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          {getLayout(<Component {...pageProps} />)}
        </main>
      </div>
    </AuthWrapper>
  );
};

// Modify AuthWrapper to focus only on auth logic
const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const username = useSelector((state: RootState) => state.auth.username);
  const router = useRouter();

  // Function to clear auth data and redirect
  const clearAuthAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    dispatch(setToken(''));
    dispatch(setRole(null));
    
    if (router.pathname !== '/') {
      router.push('/');
    }
  };

  // Check token validity periodically
  useEffect(() => {
    if (!token) return;

    const checkTokenValidity = () => {
      if (!isTokenValid(token)) {
        clearAuthAndRedirect();
      }
    };

    checkTokenValidity();
    const intervalId = setInterval(checkTokenValidity, 60000);
    return () => clearInterval(intervalId);
  }, [token]);

  // Set up axios interceptor for 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          clearAuthAndRedirect();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return <>{children}</>;
};

export default MyApp;