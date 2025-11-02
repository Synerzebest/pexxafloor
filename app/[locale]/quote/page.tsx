import React from 'react';
import { Navbar } from '@/components';
import { Footer } from '@/components';
import { SurfaceWrapper } from '@/components';

const page = () => {
    return (
        <>
          <Navbar />
          <SurfaceWrapper />
          <Footer />  
        </>
    )
}

export default page
