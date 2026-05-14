'use client';
import { handleOnSuccessLoginWithGoogle } from '@/services/google.service.js';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import React, { useEffect } from 'react';

const page = () => {
    useGoogleOneTapLogin({
        onSuccess: handleOnSuccessLoginWithGoogle,
        onError: () => {
            console.log('Login Failed');
        },
    });

    useEffect(() => {
        window.addEventListener('message', async (event) => {
            console.log('OAuth Response:', event);
            if (event.data.success) {
                // window.location.href = '/';
                const response = await fetch(
                    'http://localhost:4000/auth/github/set-cookie?sessionId=1234',
                    {
                        method: 'GET',
                        // body: JSON.stringify(event.data.sessionId),
                        // headers: {
                        //     'content-type': 'application/json',
                        // },
                        credentials: 'include',
                    },
                );
                console.log(response);
            }
        });
    }, []);

    const loginGithub = () => {
        window.open(
            'http://localhost:4000/auth/github',
            'github-oauth',
            'width=500,height=600',
        );
    };

    return (
        <>
            {/* {/* <div className="flex flex-row h-screen items-center justify-center"> */}
            <GoogleLogin
                    onSuccess={handleOnSuccessLoginWithGoogle}
                    shape="rectangular"
                    type="icon"
                    onError={() => {
                        console.log('Login Failed');
                    }}
                />
            {/* <button
                    className="text-white bg-amber-300"
                    onClick={async () => {
                        // const response = await fetch("http://localhost:4000/auth/github")
                        // window.location.href = "http://localhost:4000/auth/github";
                        window.open(
                            'https://github.com/login/oauth/authorize?client_id=Ov23li4xRPamYGQ8NOYr&scope=user:email&redirect_uri=http://localhost:4000/auth/github/callback',
                            'pop-up',
                            'width=500',
                        );
                    }}
                >
                    login with github
                </button> */}
            <button onClick={loginGithub}>Login with Github</button>
            {/* </div> */}
        </>
    );
};

export default page;
