#!/usr/bin/python


import cv
import serial

class Target:

    def __init__(self):
        
        cv.NamedWindow("FaceDetect", 1)
        self.SERIAL_PORT = '/dev/ttyACM0'
        self.SERIAL_REF = None
         
        self.camera = cv.CaptureFromCAM(1)
        if not self.camera:
            print "Error opening capture device"
            sys.exit(1)    
                   
        cv.SetCaptureProperty(self.camera, cv.CV_CAP_PROP_FRAME_WIDTH, 320)
        cv.SetCaptureProperty(self.camera, cv.CV_CAP_PROP_FRAME_HEIGHT, 240)         
        self.storage = cv.CreateMemStorage(0)
        self.WHITE = cv.RGB(255,255,255)
        
        self.min_size = (20, 20)
        self.image_scale = 2
        self.haar_scale = 1.5
        self.min_neighbors = 1
        self.haar_flags = cv.CV_HAAR_DO_CANNY_PRUNING            
            
        self.frontalface_alt_cascade = cv.Load("haarcascades/haarcascade_frontalface_alt.xml")

    def run(self):
        cx = 0
        while True:
            frame = cv.QueryFrame(self.camera)
            if frame is None:
                break
            #cv.Flip(frame, None, 1)
            image_size = cv.GetSize(frame)
            # create grayscale version
            grayscale = cv.CreateImage(image_size, 8, 1)
            cv.CvtColor(frame, grayscale, cv.CV_BGR2GRAY)
            # equalize histogram
            #cv.EqualizeHist(grayscale, grayscale)
            
            faces = cv.HaarDetectObjects(grayscale, self.frontalface_alt_cascade, self.storage, self.haar_scale, self.min_neighbors, self.haar_flags)
            if faces:# If faces are found
                ((x, y, w, h), n) = faces[0] # just pick the first face
                cx = int(x + (w/2))
                cv.Line(grayscale, (cx,0), (cx, grayscale.height), self.WHITE, 1, cv.CV_AA, 0)
                self.doTrack(cx)
                
            cv.ShowImage("FaceDetect", grayscale)        
        
            key = cv.WaitKey(5)
            if key == 0x1b: # if ESC pressed
                if self.SERIAL_REF:
                    self.SERIAL_REF.close()
                    print 'serial closed...'
                break   


       
    def doTrack(self, x):
        tolerance = 20
        center = 160
        error = abs(x - center)
        correction = str(5) #str(abs(error)//3)
        
        if error < tolerance:
            self.serialCommand('s')
        elif x > center:
            self.serialCommand('r' + correction)
        elif x < center:
            self.serialCommand('l' + correction)

    def serialCommand(self, commandData):
        print commandData
        if not self.SERIAL_REF:
            self.SERIAL_REF = serial.Serial(self.SERIAL_PORT, baudrate=9600, timeout=None)
            print 'serial opened...'
        self.SERIAL_REF.write(commandData + '\n')       

if __name__=="__main__":
    t = Target()
    t.run()
