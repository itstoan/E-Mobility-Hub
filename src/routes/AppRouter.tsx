import { Navigate, Route, Routes } from 'react-router';
import { LoginPage } from '../features/auth';
import {
    ExploreHubsPage,
    VehicleDetailsPage,
} from '../features/mobility-hub';
import {
    MyReservationsPage,
    ParkingReservationPage,
    VehiclePickupPage,
    VehicleReservePage,
} from '../features/reservations';
import { MainLayout } from '../layouts';
import { useAuthStore } from '../stores/useAuthStore';
import type { UserRole } from '../types/domain';
import { ROUTES, getDefaultHomeByRole } from './paths';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';

//UC07 import
import { MonitorNetworkPage } from '../features/monitoring/pages/MonitorNetworkPage';
import { HubResourcesDetailPage } from '../features/monitoring/pages/HubResourcesDetailPage';
import { ManageChargingPage } from '../features/charging/pages/ManageChargingPage';

interface RouteStubProps {
    useCase: string;
    title: string;
    featurePath: string;
}

function RouteStub({ useCase, title, featurePath }: RouteStubProps) {
    return (
        <div className="rounded-2xl border border-border-default bg-surface-subtle p-6">
            <span className="inline-block rounded-full bg-status-success-bg px-3 py-1 font-heading text-xs font-bold text-status-success-text">
                {useCase}
            </span>
            <h1 className="mt-2 font-heading text-3xl font-bold text-text-primary">
                {title}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
                Feature target: <code>{featurePath}</code>
            </p>
        </div>
    );
}

function RootRedirect() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const authStatus = useAuthStore((state) => state.authStatus);
    const role: UserRole | null =
        authStatus === 'authenticated' ? (currentUser?.role ?? null) : null;

    return <Navigate to={getDefaultHomeByRole(role)} replace />;
}

export function AppRouter() {
    return (
        <Routes>
            {/* Default redirect based on auth state and role */}
            <Route path={ROUTES.ROOT} element={<RootRedirect />} />

            {/* Public Route: UC00 */}
            <Route element={<PublicOnlyRoute />}>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            </Route>

            {/* Student Protected Routes: UC01 - UC06 */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route element={<MainLayout />}>
                    <Route
                        path={ROUTES.STUDENT.ROOT}
                        element={<Navigate to={ROUTES.STUDENT.HUBS} replace />}
                    />
                    <Route path={ROUTES.STUDENT.HUBS} element={<ExploreHubsPage />} />
                    <Route
                        path={ROUTES.STUDENT.VEHICLE_DETAILS()}
                        element={<VehicleDetailsPage />}
                    />
                    <Route
                        path={ROUTES.STUDENT.VEHICLE_RESERVE()}
                        element={<VehicleReservePage />}
                    />
                    <Route
                        path={ROUTES.STUDENT.RESERVATIONS}
                        element={<MyReservationsPage />}
                    />
                    <Route
                        path={ROUTES.STUDENT.PICKUP_VEHICLE()}
                        element={<VehiclePickupPage />}
                    />
                    <Route
                        path={ROUTES.STUDENT.ACTIVE_TRIP()}
                        element={
                            <RouteStub
                                useCase="UC04"
                                title="Return Shared Electric Vehicle"
                                featurePath="src/features/reservations/pages/ActiveTripReturnPage.tsx"
                            />
                        }
                    />
                    <Route
                        path={ROUTES.STUDENT.PARKING}
                        element={<ParkingReservationPage />}
                    />
                    <Route
                        path={ROUTES.STUDENT.CHARGING}
                        element={
                            <RouteStub
                                useCase="UC06"
                                title="Submit a Charging Request"
                                featurePath="src/features/charging/pages/StudentChargingRequestPage.tsx"
                            />
                        }
                    />
                </Route>
            </Route>

            {/* System Operator Protected Routes: UC07 - UC11 */}
            <Route element={<ProtectedRoute allowedRoles={['system_operator']} />}>
                <Route element={<MainLayout />}>
                    <Route
                        path={ROUTES.OPERATOR.ROOT}
                        element={<Navigate to={ROUTES.OPERATOR.MONITORING} replace />}
                    />
                    <Route
                        path={ROUTES.OPERATOR.MONITORING}
                        element={<MonitorNetworkPage />}
                    />
                    <Route
                        path={ROUTES.OPERATOR.HUB_DETAILS()}
                        element={<HubResourcesDetailPage />}
                    />
                    <Route
                        path={ROUTES.OPERATOR.CHARGING}
                        element={<ManageChargingPage />}

                    />
                    <Route
                        path={ROUTES.OPERATOR.COORDINATION}
                        element={
                            <RouteStub
                                useCase="UC09"
                                title="Coordinate Vehicles Between Hubs"
                                featurePath="src/features/vehicle-coordination/pages/CoordinateVehiclesPage.tsx"
                            />
                        }
                    />
                    <Route
                        path={ROUTES.OPERATOR.COORDINATION_PROPOSAL()}
                        element={
                            <RouteStub
                                useCase="UC09"
                                title="Review Coordination Proposal"
                                featurePath="src/features/vehicle-coordination/pages/ReviewProposalPage.tsx"
                            />
                        }
                    />
                    <Route
                        path={ROUTES.OPERATOR.INCIDENTS}
                        element={
                            <RouteStub
                                useCase="UC10"
                                title="Manage Operational Incidents"
                                featurePath="src/features/incidents/pages/ManageIncidentsPage.tsx"
                            />
                        }
                    />
                    <Route
                        path={ROUTES.OPERATOR.INCIDENT_DETAILS()}
                        element={
                            <RouteStub
                                useCase="UC10"
                                title="Incident Details & Resolution"
                                featurePath="src/features/incidents/pages/IncidentDetailsPage.tsx"
                            />
                        }
                    />
                    <Route
                        path={ROUTES.OPERATOR.SIMULATION}
                        element={
                            <RouteStub
                                useCase="UC11"
                                title="What-If Operational Simulation"
                                featurePath="src/features/simulation/pages/OperationalSimulationPage.tsx"
                            />
                        }
                    />
                </Route>
            </Route>

            {/* Fallback 404 -> return to default page by role */}
            <Route path="*" element={<RootRedirect />} />
        </Routes>
    );
}