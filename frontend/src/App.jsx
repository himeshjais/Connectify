import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

import { Toaster } from "react-hot-toast"

// import { useQuery } from '@tanstack/react-query';
// import axios from "axios"
// import { axiosInstance } from './lib/axios.js';

import PageLoader from "./components/PageLoader";
import useAuthUser from './hooks/useAuthUser.js';
import Layout from "./components/Layout.jsx"
import { useThemeStore } from './store/useThemeStore.js';
 
const App = () => {

  //----------- axios----------
  // --------------- react query tanstack query ----------

  // const [data, setData] = useState( []);
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState(null);

  // useEffect(() => {
  //   const getData = async () => {
  //     setIsLoading(true);
  //     try {
  //       const data = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  //       const json = await data.json();
  //       setData(json)
  //     } catch (error){
  //       setError(error)
  //     } finally{
  //       setIsLoading(false)
  //     }
  //   }
  //   getData()
  // },[])
  // console.log(data);


  // tanstack query
  // const { data, isLoading, error } = useQuery({
  //   queryKey: ["todos"],

  //   queryFn: async () => {
  //     const res = await fetch("https://jsonplaceholder.typicode.com/todos");
  //     const data = await res.json();
  //     return data;
  //   }
  // })
  // console. log(data);

  // axios
  // const { 
  //   data: authData, 
  //   isLoading, 
  //   // error 
  // } = useQuery({
  //   queryKey: ["authUser"],
  //   queryFn: ,
  //   async () => {
  //     // const res = await axios.get("https://jsonplaceholder.typicode.com/todos")
  //     const res = await axiosInstance.get("/auth/me")

  //     return res.data;
  //   },
  //   retry: false, //auth check
  // })
  // Above comment code is in useAuthUser.js


  // const authUser = authData?.user
  const {isLoading, authUser} = useAuthUser()
  const {theme} = useThemeStore()
  
  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded

  // console.log({data});
  // console.log({isLoading});
  // console.log({error});

  if(isLoading) return <PageLoader />
  
// Zustand  

  return (
    //  data-theme="night"  <= daisyui
    <div className="h-screen" data-theme={theme}>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate replace to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route 
          path="/signup" 
          element={
            !isAuthenticated ? <SignUpPage /> : <Navigate replace to={isOnboarded ? "/" : "/onboarding"} />} />
        
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate replace to={isOnboarded ? "/" : "/onboarding"} />} />
        
        <Route path=
          "/notifications" 
          element={isAuthenticated ? <NotificationsPage /> : <Navigate replace to="/login" />} />
        
        <Route
          path="/call/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <CallPage />
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={false}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            ) 
          }
        />
        
        <Route 
          path="/onboarding" 
          element={
            isAuthenticated ? (
              !isOnboarded ? (
                <OnboardingPage />
              ) : (
                <Navigate replace to="/" />
              )
            ) : (
              <Navigate replace to="/login" />
            )
          }
        />
      </Routes>

      <Toaster />
    </div>
  ) 
}

export default App
