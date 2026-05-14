import { redirect } from 'next/dist/server/api-utils';
import { Router } from 'next/router';

export async function handleOnSuccessLoginWithGoogle(credentialResponse) {

    console.log(credentialResponse);
    const response = await fetch('http://localhost:4000/auth/google', {
        body: JSON.stringify({
            idToken: credentialResponse.credential,
        }),
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        credentials: 'include',
    });
    const data = await response.json();
    console.log(data);

    if (true) {
        location.href="/"
    }
}
