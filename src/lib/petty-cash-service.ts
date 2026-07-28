// src/lib/petty-cash-service.ts

// import { firestore } from "./firebase";
// import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, getDocs, Timestamp, increment } from "firebase/firestore";

// // Types
// export interface PettyCashDrawer {
//   id: string;
//   name: string;
//   balance: number; // current cash amount
//   threshold: number; // warning level
//   createdAt: Timestamp;
// }

// export interface PettyCashRequest {
//   id: string;
//   drawerId: string;
//   amount: number;
//   purpose: string;
//   requestedBy: string; // uid
//   status: "pending" | "approved" | "rejected";
//   createdAt: Timestamp;
//   approvedAt?: Timestamp;
//   approvedBy?: string;
// }

// export interface PettyCashVoucher {
//   id: string;
//   requestId: string;
//   drawerId: string;
//   amount: number;
//   receiptUrl?: string; // optional digital receipt
//   createdAt: Timestamp;
// }

// // Collection references
// const drawersCol = collection(firestore, "pettyCashDrawers");
// const requestsCol = collection(firestore, "pettyCashRequests");
// const vouchersCol = collection(firestore, "pettyCashVouchers");

// // Service functions
// export async function createDrawer(data: Omit<PettyCashDrawer, "id" | "createdAt">) {
//   console.log("data", data)
//   const ref = await addDoc(drawersCol, {
//     ...data,
//     balance: data.balance,
//     createdAt: Timestamp.now(),
//   });
//   console.log("ref", ref.id)
//   return { id: ref.id, ...data, createdAt: Timestamp.now() } as PettyCashDrawer;
// }

// // Fixed getDrawer function without syntax error
// export async function getDrawer(id: string) {
//   const docSnap = await getDoc(doc(drawersCol, id));
//   if (!docSnap.exists()) throw new Error("Drawer not found");
//   return { id: docSnap.id, ...docSnap.data() } as PettyCashDrawer;
// }

// // New helper to fetch all drawers
// export async function getDrawers() {
//   const q = query(drawersCol);
//   const snapshot = await getDocs(q);
//   return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PettyCashDrawer));
// }




// export async function requestCash(payload: Omit<PettyCashRequest, "id" | "status" | "createdAt">) {
//   const ref = await addDoc(requestsCol, {
//     ...payload,
//     status: "pending",
//     createdAt: Timestamp.now(),
//   });
//   return { id: ref.id, status: "pending", createdAt: Timestamp.now(), ...payload } as PettyCashRequest;
// }

// export async function approveRequest(requestId: string, approverUid: string) {
//   const reqRef = doc(requestsCol, requestId);
//   const reqSnap = await getDoc(reqRef);
//   if (!reqSnap.exists()) throw new Error("Request not found");
//   const request = reqSnap.data() as PettyCashRequest;
//   if (request.status !== "pending") throw new Error("Request already processed");

//   // Update request status
//   await updateDoc(reqRef, {
//     status: "approved",
//     approvedAt: Timestamp.now(),
//     approvedBy: approverUid,
//   });

//   // Create voucher automatically
//   const voucherRef = await addDoc(vouchersCol, {
//     requestId,
//     drawerId: request.drawerId,
//     amount: request.amount,
//     createdAt: Timestamp.now(),
//   });

//   // Decrease drawer balance
//   const drawerRef = doc(drawersCol, request.drawerId);
//   await updateDoc(drawerRef, {
//     balance: increment(-request.amount),
//   });

//   return { voucherId: voucherRef.id };
// }

// export async function recordReplenishment(drawerId: string, amount: number) {
//   const drawerRef = doc(drawersCol, drawerId);
//   await updateDoc(drawerRef, {
//     balance: increment(amount),
//   });
// }

// export async function checkThreshold(drawerId: string): Promise<boolean> {
//   const drawer = await getDrawer(drawerId);
//   return drawer.balance < drawer.threshold;
// }

// export async function listPendingRequests() {
//   const q = query(requestsCol, where("status", "==", "pending"));
//   const snap = await getDocs(q);
//   return snap.docs.map((d) => {
//     const data = d.data() as PettyCashRequest;
//     const { id: _, ...rest } = data;
//     return { id: d.id, ...rest };
//   });
// }

// // Note: Firestore server‑side security rules should enforce that only authorized users can perform these actions.

// export async function seedPettyCashData() {
//   // 1. Create a Drawer
//   const drawerRef = await addDoc(drawersCol, {
//     name: "Main Office Cash",
//     balance: 15000,
//     threshold: 2000,
//     createdAt: Timestamp.now(),
//   });

//   // 2. Add 3 Requests
//   const requests = [
//     { amount: 500, purpose: "Office tea and coffee supplies" },
//     { amount: 1200, purpose: "Printer ink replacement" },
//     { amount: 350, purpose: "Stationery (pens and notebooks)" },
//   ];

//   for (const req of requests) {
//     const reqRef = await addDoc(requestsCol, {
//       drawerId: drawerRef.id,
//       amount: req.amount,
//       purpose: req.purpose,
//       requestedBy: "system_admin",
//       status: "approved",
//       createdAt: Timestamp.now(),
//       approvedAt: Timestamp.now(),
//       approvedBy: "system_admin",
//     });

//     // Create voucher
//     await addDoc(vouchersCol, {
//       requestId: reqRef.id,
//       drawerId: drawerRef.id,
//       amount: req.amount,
//       createdAt: Timestamp.now(),
//     });
//   }

//   // Also add a pending request
//   await addDoc(requestsCol, {
//     drawerId: drawerRef.id,
//     amount: 450,
//     purpose: "Cleaning supplies",
//     requestedBy: "system_admin",
//     status: "pending",
//     createdAt: Timestamp.now(),
//   });

//   return drawerRef.id;
// }


// src/lib/petty-cash-service.ts
// Ensure you have initialized and exported the Realtime Database instance in your firebase.ts file:
// import { getDatabase } from "firebase/database";
// export const database = getDatabase(app);

import { Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import {
  ref,
  set,
  get,
  update,
  push,
  child,
  query,
  orderByChild,
  equalTo,
  serverTimestamp,
} from "firebase/database";

// Types (Changed Timestamp to number, as RTDB uses Unix timestamps)
export interface PettyCashDrawer {
  id: string;
  name: string;
  balance: number; // current cash amount
  threshold: number; // warning level
  createdAt: Timestamp;
}

export interface PettyCashRequest {
  id: string;
  drawerId: string;
  amount: number;
  purpose: string;
  requestedBy: string; // uid
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string;
}

export interface PettyCashVoucher {
  id: string;
  requestId: string;
  drawerId: string;
  amount: number;
  receiptUrl?: string; // optional digital receipt  
  createdAt: number;
}

const ServerValue = {
  serverTimestamp: 1000,
};



// Reference paths
const drawersRef = ref(db, "pettyCashDrawers");
const requestsRef = ref(db, "pettyCashRequests");
const vouchersRef = ref(db, "pettyCashVouchers");

// Service functions
export async function createDrawer(data: Omit<PettyCashDrawer, "id" | "createdAt">) {
  const newRef = push(drawersRef);
  const drawerData = {
    ...data,
    balance: data.balance,
    createdAt: serverTimestamp(),
  };

  await set(newRef, drawerData);

  return {
    id: newRef.key!,
    ...data,
    createdAt: Timestamp.now() // Returning local time for immediate UI use
  } as PettyCashDrawer;
}

export async function getDrawer(id: string) {
  const drawerRef = child(drawersRef, id);
  const snapshot = await get(drawerRef);

  if (!snapshot.exists()) throw new Error("Drawer not found");

  return { id: snapshot.key!, ...snapshot.val() } as PettyCashDrawer;
}

export async function getDrawers() {
  const snapshot = await get(drawersRef);
  console.log("snapshot", snapshot.val());

  if (!snapshot.exists()) return [];

  const val = snapshot.val();
  return Object.keys(val).map(key => ({ id: key, ...val[key] } as PettyCashDrawer));
}

export async function requestCash(payload: Omit<PettyCashRequest, "id" | "status" | "createdAt">) {
  const newRef = push(requestsRef);
  const reqData = {
    ...payload,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  await set(newRef, reqData);

  return {
    id: newRef.key!,
    status: "pending",
    createdAt: Date.now(),
    ...payload
  } as PettyCashRequest;
}

export async function approveRequest(requestId: string, approverUid: string) {
  const reqRef = child(requestsRef, requestId);
  const reqSnap = await get(reqRef);

  if (!reqSnap.exists()) throw new Error("Request not found");

  const request = reqSnap.val() as PettyCashRequest;
  if (request.status !== "pending") throw new Error("Request already processed");

  // Update request status
  await update(reqRef, {
    status: "approved",
    approvedAt: serverTimestamp(),
    approvedBy: approverUid,
  });

  // Create voucher automatically
  const newVoucherRef = push(vouchersRef);
  await set(newVoucherRef, {
    requestId,
    drawerId: request.drawerId,
    amount: request.amount,
    createdAt: serverTimestamp(),
  });

  // Decrease drawer balance atomically
  const drawerRef = child(drawersRef, request.drawerId);
  await update(drawerRef, {
    balance: ServerValue.serverTimestamp + (-request.amount),
  });

  return { voucherId: newVoucherRef.key! };
}

export async function recordReplenishment(drawerId: string, amount: number) {
  const drawerRef = child(drawersRef, drawerId);
  await update(drawerRef, {
    balance: ServerValue.serverTimestamp + amount,
  });
}

export async function checkThreshold(drawerId: string): Promise<boolean> {
  const drawer = await getDrawer(drawerId);
  return drawer.balance < drawer.threshold;
}

export async function listPendingRequests() {
  // Note: For this query to work efficiently, ensure you have ".indexOn": "status" 
  // defined in your Realtime Database Rules for the "pettyCashRequests" node.
  const q = query(requestsRef, orderByChild("status"), equalTo("pending"));
  const snap = await get(q);
  console.log("snap", snap.val());

  if (!snap.exists()) return [];

  const val = snap.val();
  return Object.keys(val).map(key => ({ id: key, ...val[key] } as PettyCashRequest));
}

export async function seedPettyCashData() {
  // 1. Create a Drawer
  const newDrawerRef = push(drawersRef);
  const drawerId = newDrawerRef.key!;

  await set(newDrawerRef, {
    name: "Main Office Cash",
    balance: 15000,
    threshold: 2000,
    createdAt: serverTimestamp(),
  });

  // 2. Add 3 Requests
  const requests = [
    { amount: 500, purpose: "Office tea and coffee supplies" },
    { amount: 1200, purpose: "Printer ink replacement" },
    { amount: 350, purpose: "Stationery (pens and notebooks)" },
  ];

  for (const req of requests) {
    const newReqRef = push(requestsRef);
    const reqId = newReqRef.key!;

    await set(newReqRef, {
      drawerId: drawerId,
      amount: req.amount,
      purpose: req.purpose,
      requestedBy: "system_admin",
      status: "approved",
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      approvedBy: "system_admin",
    });

    // Create voucher
    const newVoucherRef = push(vouchersRef);
    await set(newVoucherRef, {
      requestId: reqId,
      drawerId: drawerId,
      amount: req.amount,
      createdAt: serverTimestamp(),
    });
  }

  // Also add a pending request
  const pendingReqRef = push(requestsRef);
  await set(pendingReqRef, {
    drawerId: drawerId,
    amount: 450,
    purpose: "Cleaning supplies",
    requestedBy: "system_admin",
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return drawerId;
}