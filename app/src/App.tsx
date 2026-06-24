import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { CEO } from '@/pages/CEO'
import { Money } from '@/pages/Money'
import { Development } from '@/pages/Development'
import { Memory } from '@/pages/Memory'
import { Roadmap } from '@/pages/Roadmap'
import { Settings } from '@/pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="ceo" element={<CEO />} />
        <Route path="money" element={<Money />} />
        <Route path="development" element={<Development />} />
        <Route path="memory" element={<Memory />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
