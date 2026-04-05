
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { ArrowLeftIcon, SettingsIcon, LogOutIcon, UserIcon, MailIcon, PhoneIcon, BriefcaseIcon, CreditCardIcon, TagIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '../components/Icons';
import { logoutUser, updateUserProfile } from '../services/storage';
import { useAppStore } from '../store';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';

interface Props {
  user: User;
}

export const SettingsView = ({ user }: Props) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'app'>('profile');
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const { updateUser } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    const { error } = await updateUserProfile(user.id, { name: newName });
    if (error) {
      toast.error("Failed to update name");
    } else {
      updateUser({ name: newName });
      toast.success("Profile updated");
      setShowEditName(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="variant-h1 text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('app')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'app' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            App Settings
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="variant-h2 text-gray-900 group relative flex items-center gap-2">
                {user.name}
                <button onClick={() => { setNewName(user.name); setShowEditName(true); }} className="p-1 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              </h2>
              <p className="variant-body text-gray-500">{user.email}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="variant-caption text-gray-900">Account Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MailIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="variant-tiny text-gray-400">Email Address</p>
                    <p className="variant-body text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="variant-tiny text-gray-400">Full Name</p>
                    <p className="variant-body text-gray-900 font-medium">{user.name}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <PhoneIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="variant-tiny text-gray-400">Phone Number</p>
                      <p className="variant-body text-gray-900 font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors border border-red-100"
            >
              <LogOutIcon className="w-5 h-5" />
              <span>Logout from CashFlow Pro</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                <h3 className="variant-h2">Currency Settings</h3>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="variant-body font-bold text-gray-900">Indian Rupee (INR)</p>
                  <p className="variant-tiny text-gray-500">Default Currency</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">₹</span>
              </div>
            </div>
          </div>
        )}

        <Dialog open={showEditName} onOpenChange={setShowEditName}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <h3 className="text-lg font-bold text-slate-900">Update Profile Name</h3>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Full Name</label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowEditName(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={handleUpdateName} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-6">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
