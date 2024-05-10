# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose port 8080 to the outside world
EXPOSE 7000

# Command to run the application
CMD ["npm", "run"]
