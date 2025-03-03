
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import PageLayout from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Webcam } from '@/components/ui/webcam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const Register = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
  });
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, department: value }));
  };

  const handleCaptureImage = (imageData: string) => {
    setFaceImage(imageData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!faceImage) {
      toast({
        title: "Missing face image",
        description: "Please capture your face before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Registration Successful",
        description: "Your face has been registered for attendance",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        employeeId: '',
        department: '',
      });
      setFaceImage(null);
      setRegistrationStep(1);
    }, 2000);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Register Your Face"
        description="Complete the form and capture your face to register for facial recognition attendance"
        className="animate-slide-in-down"
      />
      
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 mb-8 animate-slide-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Registration Steps</h3>
            <span className="text-sm text-muted-foreground">Step {registrationStep} of 2</span>
          </div>
          
          <div className="relative">
            <div className="flex">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  registrationStep >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {registrationStep > 1 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-sm font-medium mt-2">Personal Info</span>
              </div>
              
              <div className="flex-1 mx-4 mt-5">
                <div className={`h-1 ${
                  registrationStep > 1 ? "bg-primary" : "bg-muted"
                }`}></div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  registrationStep >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {registrationStep > 2 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    "2"
                  )}
                </div>
                <span className="text-sm font-medium mt-2">Face Capture</span>
              </div>
            </div>
          </div>
        </Card>
        
        <form onSubmit={handleSubmit}>
          {registrationStep === 1 ? (
            <Card className="p-6 animate-slide-in-up">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder="EMP-12345"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={handleSelectChange} required>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (formData.name && formData.email && formData.employeeId && formData.department) {
                        setRegistrationStep(2);
                      } else {
                        toast({
                          title: "Incomplete information",
                          description: "Please fill in all required fields",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6 animate-slide-in-up">
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Capture Your Face</h3>
                  <p className="text-muted-foreground">
                    Please look directly at the camera and ensure your face is clearly visible.
                  </p>
                  
                  <div className="flex flex-col items-center">
                    <Webcam
                      onCapture={handleCaptureImage}
                      className="max-w-md w-full"
                      overlayClassName={faceImage ? "border-green-500" : ""}
                    />
                    
                    {faceImage && (
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-500 text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4 mr-1"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          Face captured successfully
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegistrationStep(1)}
                >
                  Back
                </Button>
                
                <Button type="submit" disabled={isSubmitting || !faceImage}>
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 mr-2 rounded-full border-2 border-current border-r-transparent animate-spin"></span>
                      Processing...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </PageLayout>
  );
};

export default Register;
