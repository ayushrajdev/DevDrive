'use client';
import { useEffect, useState } from 'react';
import './style.css';

const dummyUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', isLoggedIn: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', isLoggedIn: true },
    {
        id: 3,
        name: 'Mark Taylor',
        email: 'mark@example.com',
        isLoggedIn: false,
    },
];

export default function UsersPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState(dummyUsers);

    const logoutUser = (userId) => {
        alert(`Logging out user with ID: ${userId}`);
        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user.id === userId ? { ...user, isLoggedIn: false } : user,
            ),
        );
    };

    // useEffect(() => {
    //     (async () => {
    //         const response = await fetch('http://localhost:4000/admin/users', {
    //             credentials: 'include',
    //         });
    //         if (response.status == 403) {
    //             window.location.href = '/';
    //         }
    //         const data = await response.json();
    //         setUsers(data);
    //     })();
    // }, []);

    console.log(users);

    // return <h1>heelo</h1>;

    return (
        <div className="users-container">
            <h1 className="title">All Users</h1>
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users?.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                {user.isLoggedIn ? 'Logged In' : 'Logged Out'}
                            </td>
                            <td>
                                <button
                                    className="logout-button"
                                    onClick={() => logoutUser(user.id)}
                                    disabled={!user.isLoggedIn}
                                >
                                    Logout
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
