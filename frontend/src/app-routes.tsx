import { useNavigate, useRoutes } from 'react-router'
import DashboardFeature from '@/components/dashboard/dashboard-feature'
import AccountDetailFeature from '@/components/account/account-feature-detail.tsx';
import AccountIndexFeature from '@/components/account/account-feature-index.tsx';
import Report from './components/report/report-dash';

export function AppRoutes() {
  const navigate = useNavigate()
  return useRoutes([
    { index: true, element: <DashboardFeature /> },
    {index:true, path:'/report', element:<Report/>},
    {
      path: 'account',
      children: [
        {
          index: true,
          element: (
            <AccountIndexFeature
              redirect={(path: string) => {
                navigate(path)
                return null
              }}
            />
          ),
        },
        { path: ':address', element: <AccountDetailFeature /> },
      ],
    },
  ])
}
