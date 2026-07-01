const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Company = require("../models/companyModel");

exports.signup = async (data) => {

  const domain = data.email.split("@")[1];

  let company = await Company.findOne({ where: { domain } });

 
  if (!company) {
    company = await Company.create({
      name: data.companyName,
      domain: domain,
      address: data.companyAddress,
      contactNumber: data.companyContact,
    });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: "admin", 
      companyId: company.id,
    });
  } 
  
 
  else {
    
    const existingUserInCompany = await User.findOne({ 
      where: { 
        email: data.email, 
        companyId: company.id 
      } 
    });

    if (existingUserInCompany) {
   
      throw new Error("This email is already registered in this company.");
    }

   
    throw new Error("This company exists but you are not added here. Please ask the admin to add you.");
  }
};

exports.login = async (email, password) => {
  
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("This email does not exist , plz signup first.");
  }

  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Wrong password!Try again.");
  }

  
  return user;
};

exports.addMember = async (adminId, memberData) => {
  const admin = await User.findByPk(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new Error("Only admins can add members");
  }

  
  const existingUser = await User.findOne({ 
    where: { 
      email: memberData.email, 
      companyId: admin.companyId 
    } 
  });

  if (existingUser) {
    throw new Error("This user is already a member of your company.");
  }

  const hashedPassword = await bcrypt.hash(memberData.password, 10);

  return await User.create({
    username: memberData.username,
    email: memberData.email,
    password: hashedPassword,
    role: memberData.role, 
    companyId: admin.companyId,
  });
};