'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function useSupabaseUser() {
    const [user, setUser] = useState<User | null>(null);


    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        });

        return () => {
        listener.subscription.unsubscribe();
        };
    }, []);

    return user;
}
