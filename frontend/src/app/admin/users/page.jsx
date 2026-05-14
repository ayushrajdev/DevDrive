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
    const [users, setUsers] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState({});

    const [role, setRole] = useState('user');

    const logoutUser = (userId) => {
        alert(`Logging out user with ID: ${userId}`);
        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user.id === userId ? { ...user, isLoggedIn: false } : user,
            ),
        );
    };

    useEffect(() => {
        (async () => {
            const response = await fetch('http://localhost:4000/admin/users', {
                credentials: 'include',
            });
            if (response.status == 403) {
                window.location.href = '/';
            }
            const data = await response.json();
            setUsers(data);
        })();
        (async () => {
            const response = await fetch('http://localhost:4000/user/profile', {
                credentials: 'include',
            });
            const userData = await response.json();
            setRole(userData.user.role);
            setLoggedInUser(userData.user);
        })();
    }, []);

    const handleLogout = async (id) => {
        try {
            const response = await fetch(
                'http://localhost:4000/admin/user/logout',
                {
                    method: 'POST',
                    body: JSON.stringify({ userId: id }),
                    headers: {
                        'content-type': 'application/json',
                    },
                    credentials: 'include',
                },
            );
            const data = await response.json();
            console.log(data);
        } catch (error) {}
    };
    const handleDeleteUser = async (id) => {
        try {
            const response = await fetch(
                'http://localhost:4000/admin/user/delete',
                {
                    method: 'DELETE',
                    body: JSON.stringify({ userId: id }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                },
            );
            const data = await response.json();
            console.log(data);
        } catch (error) {}
    };

    console.log(users);
    console.log(loggedInUser);

    // return <h1>heelo</h1>;
    console.log(loggedInUser);
    console.log(users);

    return (
        <div className="users-container">
            <h1 className="title">All Users</h1>
            {loggedInUser?.name}: {loggedInUser?.role}
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users?.map((user, idx) => (
                        <tr key={user.id}>
                            <td>
                                <span>
                                    {idx + 1}
                                    {'...  '}{' '}
                                </span>
                                {user.name}
                            </td>
                            <td>{user.email}</td>
                            <td>
                                {user.isLoggedIn ? 'Logged In' : 'Logged Out'}
                            </td>
                            <td>
                                {user.role}{' '}
                                {loggedInUser._id == user.id && '(you)'   }
                            </td>
                            <td>
                                <button
                                    className="logout-button"
                                    onClick={() => handleLogout(user.id)}
                                    disabled={
                                        !user.isLoggedIn ||
                                        loggedInUser._id == user.id
                                    }
                                >
                                    Logout
                                </button>
                            </td>
                            {role == 'admin' && (
                                <td className="flex justify-center items-center">
                                    <button
                                        className=" bg-red-400 text-[17px] px-2 py-1 rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        onClick={() =>
                                            handleDeleteUser(user.id)
                                        }
                                        disabled={
                                            !user.isLoggedIn ||
                                            loggedInUser._id == user.id
                                        }
                                    >
                                        Delete User
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
