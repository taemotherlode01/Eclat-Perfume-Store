// components/StatusBar.tsx
import React from 'react';
import { Icon } from '@iconify/react';

interface StatusBarProps {
    status: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
    // Define the order of statuses
    const statuses = ['PENDING', 'SHIPPED', 'TRANSIT', 'DELIVERED'];
    const currentIndex = statuses.indexOf(status);

    // Define icons for each status
    const statusIcons = {
        PENDING: 'mdi:clock-outline',
        SHIPPED: 'lsicon:packing-box-filled',
        TRANSIT: 'mdi:truck-fast-outline', // Icon for TRANSIT
        DELIVERED: 'mdi:package-variant-closed-delivered'
    };

    return (
        <div className="flex flex-col items-center my-4">
            <div className="flex items-center justify-center">
                {statuses.map((step, index) => (
                    <div key={step} className="flex flex-col items-center mx-2">
                        <div
                            className={`w-12 h-12 rounded-full ${
                                index <= currentIndex ? 'bg-green-500' : 'bg-gray-300'
                            } flex items-center justify-center text-white`}
                        >
                            <Icon icon={statusIcons[step as keyof typeof statusIcons]} width="20" />
                        </div>
                        {index < statuses.length - 1 && (
                            <div
                                className={`flex-1 h-2 ${
                                    index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                                } w-full mx-2`}
                            ></div>
                        )}
                        {/* Label for each status */}
                        <span className="text-sm mt-2">{step}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusBar;
