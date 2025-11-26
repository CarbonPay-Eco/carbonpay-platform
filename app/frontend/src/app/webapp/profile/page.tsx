"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  FileText,
  Users,
  Leaf,
  Edit2,
  Wallet,
} from "lucide-react";
import WebappShell from "@/components/webapp/layout/webapp-shell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getUserProfile } from "../../api/user-service";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  walletBalance?: number;
  organization?: {
    id: string;
    name: string;
    registrationNumber?: string;
    industryType?: string;
    companySize?: string;
    description?: string;
    country?: string;
    contactEmail?: string;
    websiteUrl?: string;
    tracksEmissions?: boolean;
    emissionSources?: string[];
    sustainabilityCertifications?: string[];
    priorOffsetting?: boolean;
    createdAt: string;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getUserProfile();
        if (result.success) {
          setProfile(result.data);
        } else {
          setError(result.message || "Failed to load profile");
        }
      } catch (err) {
        setError("An error occurred while loading profile");
        console.error("Profile fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <WebappShell>
          <main className="p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-800 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-800 rounded"></div>
                <div className="h-64 bg-gray-800 rounded"></div>
              </div>
            </div>
          </main>
        </WebappShell>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute>
        <WebappShell>
          <main className="p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">
                Error Loading Profile
              </h1>
              <p className="text-gray-400">{error || "Profile not found"}</p>
            </div>
          </main>
        </WebappShell>
      </ProtectedRoute>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <WebappShell>
        <main className="p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">My Profile</h1>
              <Button variant="outline" className="border-white/10">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Information */}
              <Card className="bg-black/40">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p>{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Role</p>
                      <p className="capitalize">{profile.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p>{formatDate(profile.createdAt)}</p>
                    </div>
                  </div>

                  {typeof profile.walletBalance === "number" && (
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">
                          Account Balance
                        </p>
                        <p>${profile.walletBalance.toFixed(2)} USD</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Information */}
              {profile.organization && (
                <Card className="bg-black/40">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="mr-2 h-5 w-5" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Company Name</p>
                        <p>{profile.organization.name}</p>
                      </div>
                    </div>

                    {profile.organization.country && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Country</p>
                          <p>{profile.organization.country}</p>
                        </div>
                      </div>
                    )}

                    {profile.organization.industryType && (
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Industry</p>
                          <p>{profile.organization.industryType}</p>
                        </div>
                      </div>
                    )}

                    {profile.organization.companySize && (
                      <div className="flex items-center space-x-3">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Company Size</p>
                          <p>{profile.organization.companySize}</p>
                        </div>
                      </div>
                    )}

                    {profile.organization.registrationNumber && (
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">
                            Registration Number
                          </p>
                          <p>{profile.organization.registrationNumber}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              {profile.organization &&
                (profile.organization.contactEmail ||
                  profile.organization.websiteUrl) && (
                  <Card className="bg-black/40">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Phone className="mr-2 h-5 w-5" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {profile.organization.contactEmail && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-400">
                              Contact Email
                            </p>
                            <p>{profile.organization.contactEmail}</p>
                          </div>
                        </div>
                      )}

                      {profile.organization.websiteUrl && (
                        <div className="flex items-center space-x-3">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-400">Website</p>
                            <a
                              href={profile.organization.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:underline"
                            >
                              {profile.organization.websiteUrl}
                            </a>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Sustainability Information */}
              {profile.organization && (
                <Card className="bg-black/40">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Leaf className="mr-2 h-5 w-5" />
                      Sustainability Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Leaf className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">
                          Tracks Emissions
                        </p>
                        <p>
                          {profile.organization.tracksEmissions ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Leaf className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">
                          Prior Offsetting Experience
                        </p>
                        <p>
                          {profile.organization.priorOffsetting ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    {profile.organization.emissionSources &&
                      profile.organization.emissionSources.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">
                            Emission Sources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {profile.organization.emissionSources.map(
                              (source, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-600/20 text-green-400 rounded-md text-xs"
                                >
                                  {source}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {profile.organization.sustainabilityCertifications &&
                      profile.organization.sustainabilityCertifications.length >
                        0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">
                            Sustainability Certifications
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {profile.organization.sustainabilityCertifications.map(
                              (cert, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-md text-xs"
                                >
                                  {cert}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Company Description */}
              {profile.organization?.description && (
                <Card className="bg-black/40 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Company Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">
                      {profile.organization.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </WebappShell>
    </ProtectedRoute>
  );
}
