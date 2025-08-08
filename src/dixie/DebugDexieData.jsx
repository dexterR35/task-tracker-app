import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db_dexie } from '../dixie/db'; // Adjust the import path as necessary

const DebugDexieData = () => {
    const users = useLiveQuery(() => db_dexie.users.toArray(), []);

    const tasks = useLiveQuery(() => db_dexie.tasks.toArray(), []);

    if (!users || !tasks) return <p>Loading Dexie data...</p>;

    return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
            <h2>Dexie Database Debug</h2>

            <h3>Users</h3>
            <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f0f0f0', padding: 10 }}>
                {JSON.stringify(users, null, 2)}
            </pre>

            <h3>Tasks</h3>
            <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f0f0f0', padding: 10 }}>
                {JSON.stringify(tasks, null, 2)}
            </pre>
        </div>
    );
};

export default DebugDexieData;
