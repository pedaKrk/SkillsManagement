import { Injectable } from '@angular/core';
import { User } from '../../../models/user.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) { }

  /**
   * Generiert ein PDF mit den ausgewählten Benutzern
   * @param selectedUsers Liste der ausgewählten Benutzer
   * @param creatorFullName Name des Erstellers
   */
  async generateUserListPDF(selectedUsers: User[]): Promise<void> {
    console.log('Generiere PDF für ausgewählte Benutzer:', selectedUsers.length);
    
    // get the full name of the current user
    const creatorFullName = await this.getCurrentUserFullName();
    
    // create a new pdf document (landscape for more space)
    const doc = new jsPDF({
      orientation: 'landscape'
    });
    
    // define colors and styles
    const primaryColor: [number, number, number] = [33, 150, 243]; // blue
    
    // try to embed the logo directly
    this.embedLogoDirectly(doc);
    
    // add a title (shifted to the right due to logo)
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Liste der ausgewählten LektorInnen', 60, 22);
    
    // add the current date
    const date = new Date().toLocaleDateString('de-DE');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Erstellt am: ${date}`, 60, 30);
    
    // add the creator information
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Erstellt von: ${creatorFullName}`, 60, 38);
    
    // add a separator line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 45, doc.internal.pageSize.width - 14, 45);
    
    // add a summary
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Anzahl der ausgewählten Lehrbeauftragten: ${selectedUsers.length}`, 14, 52);
    
    // prepare the table data
    const tableColumn: string[] = ["Titel", "Vorname", "Nachname", "Email", "Telefon", "Beschäftigungsart", "Skills"];
    const tableRows: string[][] = [];
    
    // add the user data to the table
    selectedUsers.forEach(user => {
      // format the skills as a comma-separated list
      let skillsText = '-';
      if (user.skills && user.skills.length > 0) {
        skillsText = user.skills
          .map(skill => skill.skill.name || this.getSkillName(skill))
          .filter(name => name !== '-')
          .join(', ');
      }
      
      const userData: string[] = [
        user.title || '-',
        user.firstName,
        user.lastName,
        user.email,
        user.phoneNumber || '-',
        user.employmentType === 'Internal' ? 'Intern' : 'Extern',
        skillsText
      ];
      tableRows.push(userData);
    });
    
    // create the table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15 }, // title
        1: { cellWidth: 25 }, // first name
        2: { cellWidth: 25 }, // last name
        3: { cellWidth: 40 }, // email
        4: { cellWidth: 25 }, // phone number
        5: { cellWidth: 25 }, // employment type
        6: { cellWidth: 'auto' } // skills
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      didDrawPage: (data) => {
        // add a footer with page number
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Seite ${doc.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
        
        // add the company name to the footer
        doc.text(
          'Skills Management System',
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        
        // add the creator information and date to the footer
        doc.text(
          `Erstellt von: ${creatorFullName} | ${date}`,
          doc.internal.pageSize.width - data.settings.margin.right,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
    });
    
    // save the pdf
    doc.save('benutzeruebersicht.pdf');
  }
  
  // helper function to embed the logo directly
  private embedLogoDirectly(doc: jsPDF): void {
    try {
      // use a direct link to the logo
      const logoUrl = 'assets/FH_Technikum_Wien_logo.png';
      console.log('Try to embed the logo:', logoUrl);
      
      // embed the logo directly (on the left side)
      const logoHeight = 20;
      const logoWidth = 36.6; // aspect ratio of the FH Technikum Wien logo
      
      doc.addImage(logoUrl, 'PNG', 14, 14, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Fehler beim direkten Einbetten des Logos:', error);
      this.addTextLogo(doc);
    }
  }
  
  // helper function to add a text logo
  private addTextLogo(doc: jsPDF): void {
    // fallback: draw a simple text logo (on the left side)
    const x = 14;
    const y = 20;
    
    doc.setTextColor(33, 150, 243);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Skills Management', x, y);
  }
  
  // helper function to get the full name of the current user
  private async getCurrentUserFullName(): Promise<string> {
    try {
      // try to load the user profile directly
      try {
        const userProfile = await firstValueFrom(this.userService.getUserProfile());
        console.log('Benutzerprofil direkt geladen:', userProfile);
        
        if (userProfile && this.isValidUserObject(userProfile)) {
          const formattedName = this.formatUserName(userProfile);
          if (formattedName) {
            console.log('Formatierter Name aus direktem Benutzerprofil:', formattedName);
            return formattedName;
          }
        }
      } catch (profileError) {
        console.warn('Fehler beim direkten Laden des Benutzerprofils:', profileError);
      }
      
      // if the direct loading fails, try to find the user from the list of all users
      const currentUser = this.authService.currentUserValue;
      if (!currentUser || !currentUser.username) {
        throw new Error('No logged in user found');
      }
      
      console.log('Suche Benutzer mit Benutzernamen:', currentUser.username);
      
      // load all users and find the current user by the username
      const allUsers = await firstValueFrom(this.userService.getAllUsers());
      const currentUserData = allUsers.find(user => user.username === currentUser.username);
      
      console.log('Gefundener Benutzer aus Liste:', currentUserData);
      
      if (currentUserData && this.isValidUserObject(currentUserData)) {
        const formattedName = this.formatUserName(currentUserData);
        if (formattedName) {
          console.log('Formatierter Name aus Benutzerliste:', formattedName);
          return formattedName;
        }
      }
      
      // if the user was found in the list, but no name could be formatted,
      // use the username
      if (currentUser.username) {
        console.log('Use username:', currentUser.username);
        return currentUser.username;
      }
    } catch (error) {
      console.warn('Fehler beim Ermitteln des Benutzernamens:', error);
    }
    
    // generic fallback without personal information
    console.log('Use generic fallback name');
    return "Logged in user";
  }
  
  // helper function to format the username
  private formatUserName(user: any): string {
    if (!user) return '';
    
    let formattedName = '';
    
    // add title if available
    if (user.title) {
      formattedName += user.title + ' ';
    }
    
    // add first name and last name
    if (user.firstName && user.lastName) {
      formattedName += user.firstName + ' ' + user.lastName;
    } else if (user.firstName) {
      formattedName += user.firstName;
    } else if (user.lastName) {
      formattedName += user.lastName;
    }
    
    return formattedName.trim();
  }
  
  // helper function to check if a user object is valid
  private isValidUserObject(user: any): boolean {
    return user && (user.firstName || user.lastName || user.username);
  }
  
  // helper function to get the skill name
  private getSkillName(skill: any): string {
    // if skill is a string (ID), try to find the name from the skill list
    if (typeof skill === 'string') {
      return `Skill-ID: ${skill}`;
    }
    
    // if skill is an object, but no name attribute
    if (typeof skill === 'object' && skill._id) {
      return `Skill-ID: ${skill._id}`;
    }
    
    // fallback
    return '-';
  }
} 