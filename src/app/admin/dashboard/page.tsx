"use client";

import Layout from "@/app/components/admin/Layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Loading from "@/app/components/Loading";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";

interface DashboardData {
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
  customersCount: number;
  dailyRevenue: { date: string; revenue: number }[];
  dailyOrders: { date: string; orders: number }[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard-data");
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          fetchData();
        } else {
          router.push("/");
        }
      }
    } else if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, session, router]);

  if (loading || !dashboardData) {
    return <Loading />;
  }

  const revenueData = {
    labels: dashboardData.dailyRevenue.map(item => item.date),
    datasets: [
      {
        label: "Revenue",
        data: dashboardData.dailyRevenue.map(item => item.revenue),
        borderColor: "#a8a8f0",
        backgroundColor: "#d4d4fa",
        tension: 0.4,
      },
    ],
  };

  const ordersData = {
    labels: dashboardData.dailyOrders.map(item => item.date),
    datasets: [
      {
        label: "Orders",
        data: dashboardData.dailyOrders.map(item => item.orders),
        backgroundColor: "#a8a8f0",
      },
    ],
  };

  return (
    <Layout>
      <div className="flex flex-col p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4 md:my-6">
          <div className="bg-white p-3 md:p-4 rounded shadow flex flex-col items-center transition-shadow duration-300 hover:shadow-lg">
            <span className="text-lg md:text-xl font-semibold">{dashboardData.productsCount}</span>
            <span>Products</span>
          </div>
          <div className="bg-white p-3 md:p-4 rounded shadow flex flex-col items-center transition-shadow duration-300 hover:shadow-lg">
            <span className="text-lg md:text-xl font-semibold">{dashboardData.ordersCount}</span>
            <span>Orders</span>
          </div>
          <div className="bg-white p-3 md:p-4 rounded shadow flex flex-col items-center transition-shadow duration-300 hover:shadow-lg">
            <span className="text-lg md:text-xl font-semibold">฿ {dashboardData.totalRevenue}</span>
            <span>Revenue</span>
          </div>
          <div className="bg-white p-3 md:p-4 rounded shadow flex flex-col items-center transition-shadow duration-300 hover:shadow-lg">
            <span className="text-lg md:text-xl font-semibold">{dashboardData.customersCount}</span>
            <span>Customers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 md:p-4 rounded shadow transition-shadow duration-300 hover:shadow-lg">
            <h2 className="text-center font-semibold mb-4 text-base md:text-lg">Revenue Line Chart</h2>
            <Line data={revenueData} />
          </div>
          <div className="bg-white p-3 md:p-4 rounded shadow transition-shadow duration-300 hover:shadow-lg">
            <h2 className="text-center font-semibold mb-4 text-base md:text-lg">Total Order Bar Chart</h2>
            <Bar data={ordersData} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
