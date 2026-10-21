import React,{createContext,useContext,useEffect,useState} from 'react';
import {supabase} from './supabase';
const C=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null),[role,setRole]=useState('user'),[loading,setLoading]=useState(true);
useEffect(()=>{let alive=true;const refresh=async(session)=>{if(!alive)return;setUser(session?.user||null);setRole('user');if(session?.user){const {data}=await supabase.from('profiles').select('role').eq('id',session.user.id).maybeSingle();if(alive)setRole(data?.role==='admin'?'admin':'user')}if(alive)setLoading(false)};supabase.auth.getSession().then(({data})=>refresh(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>refresh(session),0)});return()=>{alive=false;subscription.unsubscribe()}},[]);
return <C.Provider value={{user,role,isAdmin:role==='admin'&&!!user,loading,signOut:()=>supabase.auth.signOut()}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C);
