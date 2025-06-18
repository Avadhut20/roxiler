import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "USER",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const { name, email, password, address, role } = form;

  // Validation
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    alert("Please enter a valid email address.");
    return;
  }

  if (!password.match(/^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/)) {
    alert("Password must be 8–16 characters long and include at least one uppercase letter and one special character.");
    return;
  }

  if (!['USER', 'OWNER', 'ADMIN'].includes(role)) {
    alert("Invalid role selected.");
    return;
  }

  if (!isLogin) {
    if (name.length < 20 || name.length > 60) {
      alert("Name must be between 20 and 60 characters.");
      return;
    }

    if (address.length > 400) {
      alert("Address must be at most 400 characters.");
      return;
    }
  }

  const url = isLogin
    ? "http://localhost:8000/api/auth/login"
    : "http://localhost:8000/api/auth/signup";

  try {
    const res = await axios.post(url, form);

    if (isLogin) {
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      switch (user.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "OWNER":
          navigate("/store/dashboard");
          break;
        case "USER":
          navigate("/user/dashboard");
          break;
        default:
          navigate("/");
      }
    } else {
      alert("Signup successful. Please log in.");
      setIsLogin(true);
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Something went wrong");
  }
};


  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white shadow-lg p-6 rounded-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Login" : "Signup"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded"
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded"
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
            required
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="USER">User</option>
            <option value="OWNER">Store Owner</option>
            <option value="ADMIN">Admin</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {isLogin ? "Login" : "Signup"}
          </button>
        </form>

        <div className="text-center mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            className="text-blue-600 font-semibold"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Signup" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
