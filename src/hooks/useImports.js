// React hooks
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
export { React, useState, useEffect, useCallback, useMemo, useRef };

// Redux hooks
import { useDispatch, useSelector, Provider } from "react-redux";
export { useDispatch, useSelector, Provider };

// Firebase
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter as fsStartAfter,
  query as fsQuery,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  fsStartAfter,
  fsQuery,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
};

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "firebase/auth";
export { initializeApp, getApps, getApp };
export { getAuth, signOut,setPersistence, browserLocalPersistence ,createUserWithEmailAndPassword};
// Utilities
import useFormat from "./useFormat";
export { useFormat };

// Analytics hook
import useAnalyticsFromRedux from "./useAnalyticsFromRedux";
export { useAnalyticsFromRedux };



// react-dom

import { useNavigate, useSearchParams, useParams, createBrowserRouter, Navigate, useLocation, RouterProvider } from "react-router-dom";
export { useNavigate, useSearchParams, useParams, createBrowserRouter, Navigate, useLocation, RouterProvider };

//recharts

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from "recharts";

export {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
};

//pdf
import { jsPDF } from "jspdf";
export { jsPDF };
