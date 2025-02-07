/*
 * Copyright (c) 2021 MarkLogic Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

package com.marklogic.gradle.fullcycle


import com.marklogic.gradle.task.BaseTest
import org.gradle.testkit.runner.UnexpectedBuildFailure

import static org.gradle.testkit.runner.TaskOutcome.SUCCESS

class SslTest extends BaseTest {


    def setupSpec() {
        createFullPropertiesFile()
        BaseTest.buildFile = new File(BaseTest.testProjectDir, 'build.gradle')
        BaseTest.buildFile << '''
            plugins {
                id 'com.marklogic.ml-data-hub'
            }

            task enableSSL(type: com.marklogic.gradle.task.MarkLogicTask) {
                doFirst {
                    def manageConfig = getProject().property("mlManageConfig")
                    manageConfig.setScheme("http")
                    manageConfig.setConfigureSimpleSsl(false)

                    def adminConfig = getProject().property("mlAdminConfig")
                    adminConfig.setScheme("http")
                    adminConfig.setConfigureSimpleSsl(false)

                    def manageClient = new com.marklogic.mgmt.ManageClient(manageConfig)
                    def adminManager = new com.marklogic.mgmt.admin.AdminManager(adminConfig)

                    def certManager = new com.marklogic.mgmt.resource.security.CertificateTemplateManager(manageClient)
                    certManager.save(adminCert())
                    certManager.save(dhfCert())

                    def gtcc = new com.marklogic.appdeployer.command.security.GenerateTemporaryCertificateCommand();
                    gtcc.setTemplateIdOrName("admin-cert");
                    gtcc.setCommonName("localhost");
                    gtcc.execute(new com.marklogic.appdeployer.command.CommandContext(getAppConfig(), manageClient, adminManager));

                    def command = new com.marklogic.appdeployer.command.security.GenerateTemporaryCertificateCommand()
                    command.setTemplateIdOrName("dhf-cert")
                    command.setCommonName("localhost")
                    command.setValidFor(365)
                    command.execute(new com.marklogic.appdeployer.command.CommandContext(getAppConfig(), manageClient, adminManager));

                    adminConfig = getProject().property("mlAdminConfig")
                    adminConfig.setScheme("https")
                    adminConfig.setConfigureSimpleSsl(true)
                    adminManager = new com.marklogic.mgmt.admin.AdminManager(adminConfig)

                    manageClient.putJson("/manage/v2/servers/Admin/properties?group-id=Default", '{"ssl-certificate-template": "admin-cert","ssl-allow-sslv3": true, "ssl-allow-tls": true, "ssl-disable-sslv3": false, "ssl-disable-tlsv1": false, "ssl-disable-tlsv1-1": false, "ssl-disable-tlsv1-2": false}')
                    adminManager.waitForRestart()
                    manageClient.putJson("/manage/v2/servers/App-Services/properties?group-id=Default", '{"ssl-certificate-template": "admin-cert","ssl-allow-sslv3": true, "ssl-allow-tls": true, "ssl-disable-sslv3": false, "ssl-disable-tlsv1": false, "ssl-disable-tlsv1-1": false, "ssl-disable-tlsv1-2": false}')
                    adminManager.waitForRestart()
                    manageClient.putJson("/manage/v2/servers/Manage/properties?group-id=Default", '{"ssl-certificate-template": "admin-cert","ssl-allow-sslv3": true, "ssl-allow-tls": true, "ssl-disable-sslv3": false, "ssl-disable-tlsv1": false, "ssl-disable-tlsv1-1": false, "ssl-disable-tlsv1-2": false}')
                    adminManager.waitForRestart()
                }
            }

            task disableSSL(type: com.marklogic.gradle.task.MarkLogicTask) {
                doFirst {
                    def manageClient = getManageClient()
                    manageClient.putJson("/manage/v2/servers/Admin/properties?group-id=Default", '{"ssl-certificate-template": ""}')
                    manageClient.putJson("/manage/v2/servers/App-Services/properties?group-id=Default", '{"ssl-certificate-template": ""}')
                    manageClient.putJson("/manage/v2/servers/Manage/properties?group-id=Default", '{"ssl-certificate-template": ""}')

                    def adminConfig = getProject().property("mlAdminConfig")
                    adminConfig.setScheme("http")
                    adminConfig.setConfigureSimpleSsl(false)
                    def adminManager = new com.marklogic.mgmt.admin.AdminManager(adminConfig)
                    adminManager.waitForRestart()

                    def manageConfig = getProject().property("mlManageConfig")
                    manageConfig.setScheme("http")
                    manageConfig.setConfigureSimpleSsl(false)
                    def mgClient = new com.marklogic.mgmt.ManageClient(manageConfig)

                    def certManager = new com.marklogic.mgmt.resource.security.CertificateTemplateManager(mgClient)
                    certManager.delete(adminCert())
                    certManager.delete(dhfCert())
                }
            }

            def adminCert() {
                return """
                    <certificate-template-properties xmlns="http://marklogic.com/manage">
                    <template-name>admin-cert</template-name>
                  <template-description>System Cert</template-description>
                    <key-type>rsa</key-type>
                  <key-options />
                    <req>
                    <version>0</version>
                    <subject>
                      <organizationName>MarkLogic</organizationName>
                    </subject>
                  </req>
                    </certificate-template-properties>
                """
            }

             def dhfCert() {
                return """
                   <certificate-template-properties xmlns="http://marklogic.com/manage">
                    <template-name>dhf-cert</template-name>
                    <template-description>Sample description</template-description>
                    <key-type>rsa</key-type>
                    <key-options />
                    <req>
                    <version>0</version>
                    <subject>
                    <countryName>US</countryName>
                    <stateOrProvinceName>VA</stateOrProvinceName>
                    <localityName>McLean</localityName>
                    <organizationName>MarkLogic</organizationName>
                    <organizationalUnitName>Consulting</organizationalUnitName>
                    <emailAddress>nobody@marklogic.com</emailAddress>
                    </subject>
                    </req>
                    </certificate-template-properties>
                """
            }
        '''

        runTask("hubInit")
        runTask("hubDeploySecurity")

        writeSSLFiles(new File(BaseTest.testProjectDir, "src/main/ml-config/servers/final-server.json"),
            new File("src/test/resources/ssl-test/ssl-server.json"))
        writeSSLFiles(new File(BaseTest.testProjectDir, "src/main/hub-internal-config/servers/job-server.json"),
            new File("src/test/resources/ssl-test/ssl-server.json"))
        writeSSLFiles(new File(BaseTest.testProjectDir, "src/main/hub-internal-config/servers/staging-server.json"),
            new File("src/test/resources/ssl-test/ssl-server.json"))

        createProperties()
        hubConfig().refreshProject()
        try {
            clearDatabases(hubConfig().DEFAULT_MODULES_DB_NAME)
        } catch (e) {
            //pass
        }
        runTask("enableSSL")
    }

    def cleanupSpec() {
        runTask("mlUndeploy", "-Pconfirm=true")
        runTask("hubDeploySecurity")
        runTask("disableSSL", "--stacktrace")
        //runTask("mlUnDeploySecurity")
    }


    void createProperties() {
        BaseTest.propertiesFile = new File(BaseTest.testProjectDir, 'gradle.properties')
        BaseTest.propertiesFile << """
        mlAdminScheme=https
        mlManageScheme=https
        mlAdminSimpleSsl=true
        mlManageSimpleSsl=true
        mlAppServicesSimpleSsl=true
        mlSslHostnameVerifier=ANY
        
        mlStagingSimpleSsl=true
        mlFinalSimpleSsl=true
        mlJobSimpleSsl=true
        """
    }


    def "bootstrap a project with ssl out the wazoo"() {
        when:
        def result = runTask('mlDeploy', "--stacktrace")
        print(result.output)

        then:
        notThrown(UnexpectedBuildFailure)
        result.task(":mlDeploy").outcome == SUCCESS
    }
}
