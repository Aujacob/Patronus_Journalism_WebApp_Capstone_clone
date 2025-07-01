What is the Patronus Journalism Web App?
The Patronus Journalism Web Application is an answer to the question of "How do we monetize journalism?"
Our answer was to create a full stack application that can allow readers to directly subscribe to individual journalists, without ads, without a middleman to consume revenue.



![5ea28f31-eb85-4b3f-87fa-9fe343b1c00d](https://github.com/user-attachments/assets/e4c0de7e-ae0d-42a2-8419-666a415a6171)



To ensure readers know they are reading the stories of real people, we included features like a Verification system: 

![43dc1f7a-9b4d-4ced-b313-6270bbb69341](https://github.com/user-attachments/assets/b437c637-423b-4eae-98d1-8800759d11ce)




We rely on Google's Firebase web hosting services for double encryption so you know your data is safe.

![image](https://github.com/user-attachments/assets/005418ff-f04a-4fb1-b741-4b348eacebc8)






Installation:
1.	First you must clone the repository:
a.	Git clone https://github.com/Aujacob/Patronus.git

2.	Install GitHub Desktop:
a.	Follow this link with its instructions in order to download GitHub Desktop: https://desktop.github.com/

3.	Launch GitHub Desktop:
a.	Once GitHub Desktop is launched, click, “Open in Visual Studio Code”

4.	Open a new terminal:
a.	Once VS code is running, click on “Terminal” on the top left of the screen 
b.	Click on “New Terminal”

5.	Install all necessary packages/libraries/tools:
a.	Node.js: 
i.	If node.js is not installed yet, install via its website’s download page: https://nodejs.org/en/download/
ii.	Follow instructions of installation after the download
iii.	Make sure to check the box that says, “Add to PATH” during installation
iv.	Restart your command prompt and type into the VS code terminal, “node -v” to check if it has been successfully installed
v.	Once “node -v” has been entered, it should display the node.js version
b.	npm install:
i.	Type into the VS code terminal, “npm install –legacy-peer-deps”
c.	npm install express:
i.	Type into the VS code terminal, “npm install express”

6.	Start the application’s frontend:
a.	cd into the path below in the VS code terminal:
C:\Users\ashra\OneDrive\Documents\GitHub\Patronus\patronusapplication\frontend
b.	Type into the VS code terminal, “npm start”

7.	Start the application’s back end:
a.	cd into the path below in the VS code terminal: C:\Users\ashra\OneDrive\Documents\GitHub\Patronus\patronusapplication\backend
b.	Type into the VS code terminal, “node server.js”

8.	If server is run and this error is encountered: “ERROR in ./src/App.js 8:0-41 Module not found: Error: Cannot find file: 'Signup.js' does not match the corresponding name on disk: '.\src\components\signup.js'. webpack compiled with 1 error and 1 warning”, navigate to Patronus\patronusapplication\frontend\src\components\signup.js and rename the file "signup.js" to "Signup.js".

9.	Journalist credentials:
a.	Email: patronusjournalismtest@gmail.com
b.	Password: Professor123!
10.	Member credentials:
a.	Email: Hanzmullerpatronus@gmail.com	
b.	Password: P@$$w0rd123
