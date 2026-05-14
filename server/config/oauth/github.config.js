export const clientId ="Ov23li4xRPamYGQ8NOYr"

export const clientSecret= "bf3d317d785067f15917472a5f9207b4cb28a495"

export const githubAuthUrl = `https://github.com/login/oauth/authorize
?client_id=${clientId}
&scope=user:email
&redirect_uri=http://localhost:4000/auth/github/callback`
